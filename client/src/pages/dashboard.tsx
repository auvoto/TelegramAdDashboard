import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertChannelSchema, type Channel } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Users, Pencil, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import React from 'react';

function EditChannelDialog({ 
  channel, 
  isOpen, 
  onOpenChange, 
  onEditSuccess 
}: { 
  channel: Channel | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEditSuccess: () => void;
}) {
  const { toast } = useToast();

  const editChannelForm = useForm({
    resolver: zodResolver(insertChannelSchema),
    defaultValues: {
      name: "",
      subscribers: 0,
      inviteLink: "",
      description: "",
      logo: undefined,
    },
  });

  // Reset form when channel or open state changes
  React.useEffect(() => {
    if (channel && isOpen) {
      editChannelForm.reset({
        name: channel.name,
        subscribers: channel.subscribers,
        inviteLink: channel.inviteLink,
        description: channel.description || "",
      });
    }
  }, [channel, isOpen]);

  const editChannelMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!channel) return;
      const res = await fetch(`/api/channels/${channel.id}`, {
        method: "PATCH",
        body: data,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: "Channel updated",
        description: "Your landing page has been updated successfully.",
      });
      onEditSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onEditChannel = (data: any) => {
    if (!channel) return;

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("subscribers", String(data.subscribers));
    formData.append("inviteLink", data.inviteLink);
    if (data.description) {
      formData.append("description", data.description);
    }

    const logoFiles = (data.logo as FileList);
    if (logoFiles && logoFiles.length > 0) {
      formData.append("logo", logoFiles[0]);
    }

    editChannelMutation.mutate(formData);
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          editChannelForm.reset();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Channel Landing Page</DialogTitle>
          <DialogDescription>
            Update the details of your channel landing page.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={editChannelForm.handleSubmit(onEditChannel)}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="name">Channel Name</Label>
            <Input {...editChannelForm.register("name")} />
            {editChannelForm.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {editChannelForm.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="subscribers">Subscribers</Label>
            <Input type="number" {...editChannelForm.register("subscribers")} />
            {editChannelForm.formState.errors.subscribers && (
              <p className="text-sm text-red-500 mt-1">
                {editChannelForm.formState.errors.subscribers.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="logo">Channel Logo</Label>
            <Input
              type="file"
              accept="image/*"
              {...editChannelForm.register("logo")}
            />
          </div>
          <div>
            <Label htmlFor="inviteLink">Telegram Invite Link</Label>
            <Input {...editChannelForm.register("inviteLink")} />
            {editChannelForm.formState.errors.inviteLink && (
              <p className="text-sm text-red-500 mt-1">
                {editChannelForm.formState.errors.inviteLink.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              {...editChannelForm.register("description")}
              rows={6}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={editChannelMutation.isPending}
          >
            {editChannelMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [editingChannel, setEditingChannel] = React.useState<Channel | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const channelsQuery = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const channelForm = useForm({
    resolver: zodResolver(insertChannelSchema),
    defaultValues: {
      name: "",
      subscribers: 0,
      inviteLink: "",
      description: "",
      logo: undefined,
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/channels", {
        method: "POST",
        body: data,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: "Channel created",
        description: "Your landing page has been generated successfully.",
      });
      channelForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/channels/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: "Channel deleted",
        description: "Your landing page has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitChannel = (data: any) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("subscribers", String(data.subscribers));
    formData.append("inviteLink", data.inviteLink);
    if (data.description) {
      formData.append("description", data.description);
    }

    const logoFiles = (data.logo as FileList);
    if (logoFiles && logoFiles.length > 0) {
      formData.append("logo", logoFiles[0]);
    }

    createChannelMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Adova Marketing</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, {user?.username}</span>
              {user?.role === "admin" && (
                <Button variant="outline" asChild>
                  <a href="/admin">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Team
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Your Channels</h2>
              <p className="text-gray-600">Manage your Telegram channel landing pages</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Channel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Channel Landing Page</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to create a new landing page for your Telegram channel.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={channelForm.handleSubmit(onSubmitChannel)}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Channel Name</Label>
                    <Input {...channelForm.register("name")} />
                    {channelForm.formState.errors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {channelForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="subscribers">Subscribers</Label>
                    <Input type="number" {...channelForm.register("subscribers")} />
                    {channelForm.formState.errors.subscribers && (
                      <p className="text-sm text-red-500 mt-1">
                        {channelForm.formState.errors.subscribers.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="logo">Channel Logo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      {...channelForm.register("logo")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="inviteLink">Telegram Invite Link</Label>
                    <Input {...channelForm.register("inviteLink")} />
                    {channelForm.formState.errors.inviteLink && (
                      <p className="text-sm text-red-500 mt-1">
                        {channelForm.formState.errors.inviteLink.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      {...channelForm.register("description")}
                      placeholder="👨🏻‍🏫 Start Your Profitable Journey with NISM Registered research analyst&#10;&#10;India's Best Channel For Option Trading&#10;&#10;✅ 👇🏻Click on the below link Before it Expires 👇🏻"
                      rows={6}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createChannelMutation.isPending}
                  >
                    {createChannelMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Landing Page
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channelsQuery.data?.map((channel) => (
              <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <img src={channel.logo} alt={channel.name} className="w-12 h-12 rounded-full" />
                    <div>
                      <CardTitle>{channel.name}</CardTitle>
                      <p className="text-sm text-gray-500">{channel.subscribers} subscribers</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        const url = `${window.location.origin}/channels/${channel.uuid}`;
                        navigator.clipboard.writeText(url);
                        toast({
                          title: "URL copied",
                          description: "Landing page URL copied to clipboard",
                        });
                      }}
                    >
                      Copy URL
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditingChannel(channel);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this channel?")) {
                          deleteChannelMutation.mutate(channel.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <EditChannelDialog
        channel={editingChannel}
        isOpen={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingChannel(null);
          }
        }}
        onEditSuccess={() => {
          setEditingChannel(null);
        }}
      />
    </div>
  );
}