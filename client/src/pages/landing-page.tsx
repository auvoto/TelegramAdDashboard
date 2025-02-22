import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Channel } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

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
    // Initialize Facebook Pixel (keep client-side tracking as fallback)
    const script = document.createElement("script");
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '520700944254644');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!channelQuery.data) return;

    // Track channel view
    if (window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: channelQuery.data.name,
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
      // Track subscribe event server-side
      await apiRequest(`/api/channels/${uuid}/track-subscribe`, {
        method: "POST",
      });

      // Keep client-side tracking as fallback
      if (window.fbq) {
        window.fbq("track", "Subscribe", {
          content_name: channelQuery.data?.name,
        });
      }
    } catch (error) {
      console.error("Failed to track subscribe event:", error);
      // Continue with redirect even if tracking fails
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
      <style>
        {`
          .telegram-link {
            background-color: #0088cc;
            color: white;
            padding: 10px;
            border-radius: 5px;
            text-decoration: none;
            display: inline-block;
            margin-top: 10px;
          }

          .telegram-link:hover {
            background-color: #006699;
          }

          .icon {
            border-radius: 50%;
            margin-top: 20px;
            width: 100px;
            height: 100px;
          }

          .countdown {
            font-size: 1.5em;
            margin: 10px 0;
            color: red;
          }
        `}
      </style>

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
        <img src={channel.logo} alt={channel.name} className="icon mx-auto" />
        <h1 className="text-2xl font-bold mt-4">
          <img
            src={channel.logo}
            alt={channel.name}
            className="hidden w-6 h-6 rounded-full"
          />{" "}
          {channel.name}
        </h1>
        <p className="mt-0 text-gray-500">
          <small>{channel.subscribers} subscribers</small>
        </p>
        <p className="mt-4 whitespace-pre-line">{channel.description}</p>
        <div className="countdown" id="countdown">
          Invitation closes in 10s
        </div>
        <a
          href={channel.inviteLink}
          className="telegram-link"
          onClick={handleTelegramClick}
          rel="noopener noreferrer"
        >
          VIEW IN TELEGRAM
        </a>
        <p className="text-gray-600 text-sm mt-5">
          If you have Telegram you can view and join {channel.name} right away.
        </p>
        <div className="text-gray-500 text-sm mt-8">
          Maintained by{" "}
          <a
            href="https://metabulluniverse.digital/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#007BFF] hover:underline"
          >
            Meta Bull Universe
          </a>
        </div>
      </div>

      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src="https://www.facebook.com/tr?id=485785431234952&ev=PageView&noscript=1"
        />
      </noscript>
    </div>
  );
}
