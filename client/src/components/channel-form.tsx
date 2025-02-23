import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertChannelSchema } from "@shared/schema";
import { ChevronDown, ChevronUp, Settings } from "lucide-react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ChannelFormProps {
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export function ChannelForm({ onSubmit, isLoading = false }: ChannelFormProps) {
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertChannelSchema),
    defaultValues: {
      name: "",
      subscribers: 0,
      inviteLink: "",
      description: "",
      logo: undefined,
      customPixelId: "",
      customAccessToken: "",
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("subscribers", String(data.subscribers));
    formData.append("inviteLink", data.inviteLink);
    if (data.description) {
      formData.append("description", data.description);
    }
    if (data.customPixelId) {
      formData.append("customPixelId", data.customPixelId);
    }
    if (data.customAccessToken) {
      formData.append("customAccessToken", data.customAccessToken);
    }

    const logoFiles = form.getValues("logo") as FileList;
    if (logoFiles?.[0]) {
      formData.append("logo", logoFiles[0]);
    }

    onSubmit(formData);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Channel Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subscribers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Subscribers</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logo"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Channel Logo</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => onChange(e.target.files)}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inviteLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telegram Invite Link</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Collapsible
          open={isAdditionalOpen}
          onOpenChange={setIsAdditionalOpen}
          className="border rounded-lg p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 w-full justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Additional Details</span>
                </div>
                {isAdditionalOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="customPixelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Facebook Pixel ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Optional" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customAccessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Facebook Access Token</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Optional" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        <div className="pt-4">
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Channel
          </Button>
        </div>
      </form>
    </Form>
  );
}