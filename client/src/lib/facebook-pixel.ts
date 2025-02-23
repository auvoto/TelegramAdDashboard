// Initialize Facebook Pixel
export function initFacebookPixel(pixelId: string) {
  if (typeof window === 'undefined') return;

  // Add Facebook Pixel base code
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', pixelId);
}

// Track pageview
export function trackPageView() {
  if (typeof fbq !== 'undefined') {
    fbq('track', 'PageView');
  }
}

// Track subscribe event
export function trackSubscribe(channelUuid: string) {
  return fetch(`/api/channels/${channelUuid}/track-subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
