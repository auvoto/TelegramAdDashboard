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

export function ChannelForm({ onSubmit, isLoading = false }) {
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertChannelSchema),
    defaultValues: {
      name: "",
      subscribers: 0,
      inviteLink: "",
      description: "",
      customPixelId: "",
      customAccessToken: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            Create Channel
          </Button>
        </div>
      </form>
    </Form>
  );
}
