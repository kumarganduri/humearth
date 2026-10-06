// Visitor counts: Cloudflare Web Analytics (cookieless; Cloudflare already hosts the site). Loaded only on
// the real site, so test runs, local previews and preview deploys never count as visits. The token is public
// by design (it is in every page's source); the CSP in public/_headers allows exactly this script and its
// reporting endpoint.
//
//   humearth.org / www  ──►  <script defer src=static.cloudflareinsights.com/beacon.min.js data-cf-beacon>
//   anything else       ──►  nothing

export const CF_ANALYTICS_TOKEN = 'e57c910a04784d82a8a18c6bcd95e3e6';
export const COUNTED_HOSTS = ['humearth.org', 'www.humearth.org'];
export const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

export function shouldCount(hostname: string, token: string): boolean {
  return Boolean(token) && COUNTED_HOSTS.includes(hostname);
}

export function startAnalytics(doc: Document = document, hostname = location.hostname, token = CF_ANALYTICS_TOKEN): void {
  if (!shouldCount(hostname, token) || doc.querySelector(`script[src="${BEACON_SRC}"]`)) return;
  const s = doc.createElement('script');
  s.defer = true;
  s.src = BEACON_SRC;
  s.dataset.cfBeacon = JSON.stringify({ token });
  doc.head.append(s);
}

if (typeof document !== 'undefined') startAnalytics();
