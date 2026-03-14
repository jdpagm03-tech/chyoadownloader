/* ===================== PROXY POOL ===================== */

const PROXIES = [
  // JSON Proxy (funktioniert)
  {
    name: "AllOrigins",
    build: url =>
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    type: "json"
  },

  // HTML Proxy
  {
    name: "CodeTabs",
    build: url =>
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    type: "text"
  },

  // HTML Proxy
  {
    name: "CorsProxy",
    build: url =>
      `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    type: "text"
  }
];

let activeProxyIndex = 0;

/* ===================== FETCH CORE ===================== */

async function tryFetch(url, proxyIndex) {
  const proxy = PROXIES[proxyIndex];
  const proxiedUrl = proxy.build(url);

  const res = await fetch(proxiedUrl);

  if (!res.ok) {
    throw new Error(`${proxy.name} responded with ${res.status}`);
  }

  // ✅ Unterschiedliche Verarbeitung je nach Proxy-Typ
  if (proxy.type === "json") {
    const json = await res.json();

    if (!json?.contents) {
      throw new Error("Invalid JSON proxy response");
    }

    return json.contents;
  }

  if (proxy.type === "text") {
    const text = await res.text();

    if (!text || text.length < 50) {
      throw new Error("Invalid HTML response");
    }

    return text;
  }

  throw new Error("Unknown proxy type");
}

/* ===================== PUBLIC FETCH ===================== */

export async function fetchViaProxy(url) {
  for (let i = 0; i < PROXIES.length; i++) {
    try {
      const result = await tryFetch(url, activeProxyIndex);
      return result;
    } catch (err) {
      console.warn(
        `Proxy ${PROXIES[activeProxyIndex].name} failed. Switching...`
      );

      activeProxyIndex =
        (activeProxyIndex + 1) % PROXIES.length;
    }
  }

  throw new Error("All proxy services failed.");
}

/* ===================== HEALTH CHECK ===================== */

export async function checkProxyHealth() {
  const testUrl = "https://example.com/";

  for (let i = 0; i < PROXIES.length; i++) {
    try {
      await tryFetch(testUrl, i);
      activeProxyIndex = i;
      return true;
    } catch {
      continue;
    }
  }

  return false;
}
