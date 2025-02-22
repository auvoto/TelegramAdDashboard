import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertChannelSchema, type Channel } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const channelsQuery = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

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
    formData.append("subscribers", data.subscribers.toString());
    formData.append("inviteLink", data.inviteLink);
    formData.append("description", data.description || "");
    formData.append("logo", data.logo[0]);

    createChannelMutation.mutate(formData);
  };

  if (channelsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.username}</h1>
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
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="name">Channel Name</Label>
                <Input {...form.register("name")} />
              </div>
              <div>
                <Label htmlFor="subscribers">Subscribers</Label>
                <Input type="number" {...form.register("subscribers")} />
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
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  {...form.register("description")} 
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
          <Card key={channel.id}>
            <CardHeader>
              <CardTitle>{channel.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                {channel.subscribers} subscribers
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
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
                  onClick={() =>
                    window.open(`/channels/${channel.uuid}`, "_blank")
                  }
                >
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}