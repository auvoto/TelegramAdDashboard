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
import { Loader2, Plus, Users, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Create Channel Dialog Component
function CreateChannelDialog({
  isOpen,
  onOpenChange
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const form = useForm({
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
      form.reset();
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

  const onSubmit = (data: any) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("subscribers", String(data.subscribers));
    formData.append("inviteLink", data.inviteLink);
    if (data.description) {
      formData.append("description", data.description);
    }

    const logoFiles = data.logo as FileList;
    if (logoFiles && logoFiles.length > 0) {
      formData.append("logo", logoFiles[0]);
    }

    createChannelMutation.mutate(formData);
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Channel Landing Page</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new landing page for your Telegram channel.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Channel Name</Label>
            <Input {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="subscribers">Subscribers</Label>
            <Input type="number" {...form.register("subscribers")} />
            {form.formState.errors.subscribers && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.subscribers.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="logo">Channel Logo</Label>
            <Input
              type="file"
              accept="image/*"
              {...form.register("logo")}
            />
          </div>
          <div>
            <Label htmlFor="inviteLink">Telegram Invite Link</Label>
            <Input {...form.register("inviteLink")} />
            {form.formState.errors.inviteLink && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.inviteLink.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              {...form.register("description")}
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
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const channelsQuery = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
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
      return id; // Return the ID to onSuccess
    },
    onSuccess: (_, deletedId) => {
      // Update the channels data in the cache by filtering out the deleted channel
      const currentChannels = queryClient.getQueryData<Channel[]>(["/api/channels"]) || [];
      queryClient.setQueryData(
        ["/api/channels"],
        currentChannels.filter(channel => channel.id !== deletedId)
      );

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
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Channel
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channelsQuery.data?.map((channel) => (
              <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <img src={channel.logo} alt={channel.name} className="w-12 h-12 rounded-full object-cover" />
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

      <CreateChannelDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}