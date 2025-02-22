import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Channel } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function LandingPage() {
  const { uuid } = useParams();
  const channelQuery = useQuery<Channel>({
    queryKey: [`/api/channels/${uuid}`],
  });

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
    <div>
      <style jsx>{`
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f8f9fa;
          text-align: center;
        }

        .container {
          background-color: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 90%;
        }

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

        .header {
          background-color: #00AEEF;
          color: white;
          padding: 10px;
        }

        .icon {
          border-radius: 50%;
          margin-top: 20px;
          width: 100px;
          height: 100px;
        }

        .emoji {
          font-size: 1.5em;
        }

        .note {
          color: gray;
          font-size: 0.9em;
          margin-top: 20px;
        }

        .maintained {
          margin-top: 30px;
          color: gray;
          font-size: 0.9em;
        }

        .maintained a {
          color: #007BFF;
          text-decoration: none;
        }

        .maintained a:hover {
          text-decoration: underline;
        }

        .countdown {
          font-size: 1.5em;
          margin: 10px 0;
          color: red;
        }
      `}</style>

      <div className="container">
        <div className="header">
          Don't have{" "}
          <strong>
            <a
              href="https://web.telegram.org/k/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram
            </a>
          </strong>{" "}
          yet? Try it now!
        </div>

        <img src={channel.logo} alt={channel.name} className="icon" />
        <h1 className="avitr-t-name">
          <img src={channel.logo} alt={channel.name} /> {channel.name}
        </h1>
        <p style={{ marginTop: 0, paddingTop: 0 }}>
          <small className="text-gray">{channel.subscribers} subscribers</small>
        </p>
        <p>
          <span className="emoji">👨🏻‍🏫</span> Start Your Profitable Journey with NISM
          Registered research analyst
        </p>
        <p>India's Best Channel For Option Trading</p>
        <p>✅ 👇🏻Click on the below link Before it Expires 👇🏻</p>
        <div className="countdown" id="countdown">
          Invitation closes in 10s
        </div>
        <a
          href={channel.inviteLink}
          className="telegram-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          VIEW IN TELEGRAM
        </a>
        <p className="note">
          If you have Telegram you can view and join {channel.name} right away.
        </p>
        <div className="maintained">
          Maintained by{" "}
          <a
            href="https://metabulluniverse.digital/contact"
            target="_blank"
            rel="noopener noreferrer"
          >
            Meta Bull Universe
          </a>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            let countdownElement = document.getElementById('countdown');
            let countdownTime = 10;

            function updateCountdown() {
                countdownElement.textContent = \`Invitation closes in \${countdownTime}s\`;
                if (countdownTime > 0) {
                    countdownTime--;
                    setTimeout(updateCountdown, 1000);
                }
            }

            updateCountdown();
          `,
        }}
      />
    </div>
  );
}