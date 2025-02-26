import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Channel } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useEffect, lazy, Suspense } from "react";
import { initFacebookPixel, trackPageView, trackSubscribe } from "@/lib/facebook-pixel";

// Lazy load image component to reduce initial bundle size
const Image = lazy(() => import('@/components/ui/image'));

declare global {
  interface Window {
    fbq: any;
  }
}

export default function LandingPage() {
  const { uuid } = useParams();
  const channelQuery = useQuery<Channel>({
    queryKey: [`/api/channels/${uuid}`],
    staleTime: 300000, // Cache for 5 minutes
    cacheTime: 3600000, // Keep in cache for 1 hour
  });

  useEffect(() => {
    if (!channelQuery.data) return;

    const channel = channelQuery.data;
    const pixelId = channel.customPixelId || '520700944254644';

    // Preload logo image
    const img = new Image();
    img.src = channel.logo;

    // Initialize Facebook Pixel
    initFacebookPixel(pixelId);
    trackPageView();

    // Track channel view
    if (window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: channel.name,
        content_type: 'channel',
        content_ids: [channel.uuid]
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

  async function handleTelegramClick(
    event: React.MouseEvent<HTMLAnchorElement>,
  ) {
    event.preventDefault();
    const link = event.currentTarget.href;
    const newWindow = window.open(link, '_blank', 'noopener,noreferrer');

    try {
      if (window.fbq) {
        window.fbq("track", "Contact", {
          content_name: channelQuery.data?.name,
          content_type: 'channel',
          content_ids: [uuid]
        });
      }
      await trackSubscribe(uuid!);
    } catch (error) {
      console.error("Failed to track event:", error);
    }

    if (newWindow) newWindow.focus();
  }

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
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-border mx-auto" />}>
          <Image 
            src={channel.logo} 
            alt={channel.name} 
            className="rounded-full mt-5 w-[100px] h-[100px] mx-auto"
            loading="eager"
            decoding="async"
          />
        </Suspense>
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
          src={`https://www.facebook.com/tr?id=${channel.customPixelId || '520700944254644'}&ev=PageView&noscript=1`}
        />
      </noscript>
    </div>
  );
}