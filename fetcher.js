/* ===================== PROXY POOL ===================== */
/*
  Multi-Proxy-Failover System
  - Automatischer Wechsel bei Fehler
  - Retry-Logik
  - Health-Check kompatibel mit main.js
*/

const PROXIES = [
  // Original Proxy (war vorher allein aktiv) [1]
  url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,

  // Backup 1
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,

  // Backup 2
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`
];

let activeProxyIndex = 0;
const MAX_RETRIES = PROXIES.length;

/* ===================== INTERNAL FETCH ===================== */
async function tryFetch(url, proxyIndex) {
  const proxyFn = PROXIES[proxyIndex];
  const proxiedUrl = proxyFn(url);

  const res = await fetch(proxiedUrl);

  if (!res.ok) {
    throw new Error(`Proxy ${proxyIndex} responded with ${res.status}`);
  }

  const json = await res.json();

  if (!json?.contents || typeof json.contents !== "string") {
    throw new Error("Invalid proxy response structure");
  }

  return json.contents;
}

/* ===================== PUBLIC FETCH ===================== */
export async function fetchViaProxy(url) {
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const result = await tryFetch(url, activeProxyIndex);
      return result;
    } catch (err) {
      console.warn(
        `Proxy ${activeProxyIndex} failed. Switching to next proxy...`
      );

      // nächster Proxy (Round-Robin)
      activeProxyIndex = (activeProxyIndex + 1) % PROXIES.length;
      attempt++;
    }
  }

  throw new Error("All proxy services failed.");
}

/* ===================== HEALTH CHECK ===================== */
export async function checkProxyHealth() {
  const testUrl = "https://example.com/";

  for (let i = 0; i < PROXIES.length; i++) {
    try {
      const result = await tryFetch(testUrl, i);

      if (typeof result === "string" && result.length > 0) {
        activeProxyIndex = i;
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}
