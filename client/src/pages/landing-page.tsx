import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Channel } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { initFacebookPixel, trackPageView, trackSubscribe } from "@/lib/facebook-pixel";

declare global {
  interface Window {
    fbq: any;
  }
}

export default function LandingPage() {
  const { uuid } = useParams();
  const channelQuery = useQuery<Channel>({
    queryKey: [`/api/channels/${uuid}`],
  });

  useEffect(() => {
    // Initialize Facebook Pixel
    initFacebookPixel('520700944254644'); // Your Facebook Pixel ID
    trackPageView();
  }, []);

  useEffect(() => {
    if (!channelQuery.data) return;

    // Track channel view
    if (window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: channelQuery.data.name,
        content_type: 'channel',
        content_ids: [channelQuery.data.uuid]
      });
    }

    // Setup countdown
    const countdownElement = document.getElementById("countdown");
    let countdownTime = 10;

    function updateCountdown() {
      if (!countdownElement) return;
      countdownElement.textContent = `Invitation closes in ${countdownTime}s`;
      if (countdownTime > 0) {
        countdownTime--;
        setTimeout(updateCountdown, 1000);
      }
    }

    updateCountdown();
  }, [channelQuery.data]);

  const handleTelegramClick = async (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault();
    const link = event.currentTarget.href;

    try {
      // Track both client and server side for redundancy
      if (window.fbq) {
        window.fbq("track", "Contact", {
          content_name: channelQuery.data?.name,
          content_type: 'channel',
          content_ids: [uuid]
        });
      }

      // Track server-side
      await trackSubscribe(uuid!);
    } catch (error) {
      console.error("Failed to track event:", error);
    }

    // Open link in new tab
    window.open(link, "_blank");
  };

  if (channelQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!channelQuery.data) {
    return <div>Channel not found</div>;
  }

  const channel = channelQuery.data;

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-center">
      <div className="bg-[#00AEEF] text-white p-3">
        Don't have{" "}
        <strong>
          <a
            href="https://web.telegram.org/k/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white"
            onClick={handleTelegramClick}
          >
            Telegram
          </a>
        </strong>{" "}
        yet? Try it now!
      </div>

      <div className="max-w-[500px] w-[90%] mx-auto bg-white p-5 rounded-lg shadow-md mt-4">
        <img 
          src={channel.logo} 
          alt={channel.name} 
          className="rounded-full mt-5 w-[100px] h-[100px] mx-auto"
        />
        <h1 className="text-2xl font-bold mt-4">
          {channel.name}
        </h1>
        <p className="mt-0 text-gray-500">
          <small>{channel.subscribers} subscribers</small>
        </p>
        <p className="mt-4 whitespace-pre-line">{channel.description}</p>
        <div className="text-2xl my-4 text-red-500" id="countdown">
          Invitation closes in 10s
        </div>
        <a
          href={channel.inviteLink}
          className="bg-[#0088cc] text-white px-4 py-2 rounded hover:bg-[#006699] inline-block mt-2 transition-colors"
          onClick={handleTelegramClick}
          rel="noopener noreferrer"
        >
          VIEW IN TELEGRAM
        </a>
        <p className="text-gray-600 text-sm mt-5">
          If you have Telegram you can view and join {channel.name} right away.
        </p>
      </div>

      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=520700944254644&ev=PageView&noscript=1"
        />
      </noscript>
    </div>
  );
}