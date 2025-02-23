import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type Channel } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  Plus, 
  Users, 
  Trash2, 
  Info, 
  Search,
  Copy,
  Check
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ChannelForm } from "@/components/channel-form";
import { Input } from "@/components/ui/input";

// Channel Info Dialog Component
function ChannelInfoDialog({
  channel,
  isOpen,
  onOpenChange
}: {
  channel: Channel | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string | undefined | null, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Channel Details</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto pr-6 max-h-[calc(80vh-8rem)]">
          {channel && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img src={channel.logo} alt={channel.name} className="w-16 h-16 rounded-full" />
                <div>
                  <h3 className="font-semibold">{channel.name}</h3>
                  <p className="text-sm text-gray-500">{channel.subscribers} subscribers</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Description</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleCopy(channel.description, 'description')}
                  >
                    {copiedField === 'description' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-gray-600 whitespace-pre-line mt-1">{channel.description}</p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Invite Link</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleCopy(channel.inviteLink, 'inviteLink')}
                  >
                    {copiedField === 'inviteLink' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 break-all mt-1">{channel.inviteLink}</p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Landing Page URL</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleCopy(`${window.location.origin}/channels/${channel.uuid}`, 'landingPage')}
                  >
                    {copiedField === 'landingPage' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 break-all mt-1">
                  {`${window.location.origin}/channels/${channel.uuid}`}
                </p>
              </div>

              {channel.customPixelId && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Custom Pixel ID</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleCopy(channel.customPixelId, 'pixelId')}
                    >
                      {copiedField === 'pixelId' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{channel.customPixelId}</p>
                </div>
              )}

              {channel.customAccessToken && (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Custom Access Token</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleCopy(channel.customAccessToken, 'accessToken')}
                    >
                      {copiedField === 'accessToken' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{channel.customAccessToken}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Create Channel Dialog Component
function CreateChannelDialog({
  isOpen,
  onOpenChange
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const createChannelMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/channels", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json();
    },
    onSuccess: (newChannel) => {
      // Update the channels data in the cache by prepending the new channel
      const currentChannels = queryClient.getQueryData<Channel[]>(["/api/channels"]) || [];
      queryClient.setQueryData(
        ["/api/channels"],
        [newChannel, ...currentChannels]
      );

      toast({
        title: "Channel created",
        description: "Your landing page has been generated successfully.",
      });
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

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Create New Channel Landing Page</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new landing page for your Telegram channel.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6">
          <ChannelForm 
            onSubmit={(formData) => createChannelMutation.mutate(formData)}
            isLoading={createChannelMutation.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      return id;
    },
    onSuccess: (deletedId) => {
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

  // Filter channels based on search query
  const filteredChannels = channelsQuery.data?.filter(channel => 
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Adova Marketing</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/90">Welcome, {user?.username}</span>
              {user?.role === "admin" && (
                <Button variant="secondary" className="hover:bg-blue-100" asChild>
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
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Your Channels</h2>
              <p className="text-gray-600">Manage your Telegram channel landing pages</p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-gray-200 focus-visible:ring-blue-500"
                />
              </div>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Channel
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChannels.map((channel) => (
              <Card 
                key={channel.id} 
                className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white border-gray-200"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <img src={channel.logo} alt={channel.name} className="w-12 h-12 rounded-full object-cover shadow-md" />
                    <div>
                      <CardTitle className="text-gray-800">{channel.name}</CardTitle>
                      <p className="text-sm text-gray-500">{channel.subscribers} subscribers</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
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
                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                      onClick={() => {
                        setSelectedChannel(channel);
                        setIsInfoDialogOpen(true);
                      }}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this channel?")) {
                          deleteChannelMutation.mutate(channel.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
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

      <ChannelInfoDialog 
        channel={selectedChannel}
        isOpen={isInfoDialogOpen}
        onOpenChange={setIsInfoDialogOpen}
      />
    </div>
  );
}