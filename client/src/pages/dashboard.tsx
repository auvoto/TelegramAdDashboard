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
import { insertChannelSchema, insertPixelSettingsSchema, type Channel, type PixelSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Settings, BarChart, Users } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const channelsQuery = useQuery<Channel[]>({
    queryKey: ["/api/channels"],
  });

  const pixelSettingsQuery = useQuery<PixelSettings>({
    queryKey: ["/api/pixel-settings"],
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

  const pixelSettingsForm = useForm({
    resolver: zodResolver(insertPixelSettingsSchema),
    defaultValues: {
      pixelId: pixelSettingsQuery.data?.pixelId || "",
      accessToken: pixelSettingsQuery.data?.accessToken || "",
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

  const updatePixelSettingsMutation = useMutation({
    mutationFn: async (data: typeof insertPixelSettingsSchema._type) => {
      const res = await apiRequest("/api/pixel-settings", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pixel-settings"] });
      toast({
        title: "Settings updated",
        description: "Your pixel settings have been updated successfully.",
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

  const onSubmitPixelSettings = (data: typeof insertPixelSettingsSchema._type) => {
    updatePixelSettingsMutation.mutate(data);
  };

  if (channelsQuery.isLoading) {
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
                    Manage Users
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="channels" className="space-y-6">
          <TabsList>
            <TabsTrigger value="channels">
              <BarChart className="h-4 w-4 mr-2" />
              Channels
            </TabsTrigger>
            {user?.role !== "admin" && (
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Pixel Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="channels" className="space-y-6">
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
                  </DialogHeader>
                  <form
                    onSubmit={channelForm.handleSubmit(onSubmitChannel)}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="name">Channel Name</Label>
                      <Input {...channelForm.register("name")} />
                    </div>
                    <div>
                      <Label htmlFor="subscribers">Subscribers</Label>
                      <Input type="number" {...channelForm.register("subscribers")} />
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
          </TabsContent>

          {user?.role !== "admin" && (
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Facebook Pixel Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={pixelSettingsForm.handleSubmit(onSubmitPixelSettings)}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="pixelId">Pixel ID</Label>
                      <Input {...pixelSettingsForm.register("pixelId")} />
                    </div>
                    <div>
                      <Label htmlFor="accessToken">Access Token</Label>
                      <Input
                        type="password"
                        {...pixelSettingsForm.register("accessToken")}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={updatePixelSettingsMutation.isPending}
                    >
                      {updatePixelSettingsMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Settings
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}