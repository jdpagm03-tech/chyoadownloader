import { fetchViaProxy } from "./fetcher.js";
import { dom } from "./dom.js";

export async function scrapeFromEnd(startUrl) {
  const parser = new DOMParser();

  let chapters = [];
  let current = startUrl;
  let visited = new Set();
  let attempts = 0;

  let delay = 120;
  const MAX_DELAY = 800;

  while (current && !visited.has(current)) {
    dom.progress.innerText = `Chapters fetched: ${chapters.length}`;
    dom.log.innerText = `Fetching:\n${current}`;

    try {
      const html = await fetchViaProxy(current);
      const doc = parser.parseFromString(html, "text/html");

      const title = doc.querySelector("h1")?.innerText.trim();
      const bodyEl = doc.querySelector(
        ".chapter-body, .chapter-content, article.story-text, .inner-content"
      );

      if (!title || !bodyEl) throw new Error("Invalid structure");

      const fingerprint = title + bodyEl.innerText.length;
      if (visited.has(fingerprint)) break;
      visited.add(fingerprint);

      chapters.push({ title, body: bodyEl.innerHTML });

      let prev =
        doc.querySelector(".breadcrumb li:nth-last-child(2) a")?.href ||
        [...doc.querySelectorAll("a")]
          .find(a => a.textContent.trim().toLowerCase() === "previous chapter")
          ?.href;

      if (prev?.startsWith("/")) prev = "https://chyoa.com" + prev;
      current = prev || null;

      attempts = 0;
      delay = 120;

    } catch (e) {
      attempts++;
      delay = Math.min(delay * 2, MAX_DELAY);

      if (attempts >= 10) {
        dom.log.innerText = "Too many failures. Stopping.";
        break;
      }
    }

    await new Promise(r => setTimeout(r, delay));
  }

  return chapters.reverse();
}
