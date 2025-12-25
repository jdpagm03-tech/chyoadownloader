const PROXY = url =>
  `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

/* ✅ Normaler Fetch */
export async function fetchViaProxy(url) {
  const res = await fetch(PROXY(url));
  if (!res.ok) throw new Error(res.status);

  const json = await res.json();
  if (!json?.contents) throw new Error("Empty proxy response");

  return json.contents;
}

/* ✅ NEU: Proxy Health Check */
export async function checkProxyHealth() {
  try {
    const testUrl = "https://example.com";
    const res = await fetch(PROXY(testUrl), { cache: "no-store" });

    if (!res.ok) return false;

    const json = await res.json();
    return typeof json?.contents === "string";
  } catch {
    return false;
  }
}
