import { dom } from "./dom.js";
import { scrapeFromEnd } from "./scraper.js";
import {
  cacheStory,
  loadCachedStory,
  clearStoryCache
} from "./state.js";
import {
  renderChapters,
  showDownloadSection,
  clearPreview,
  setProxyStatus
} from "./ui.js";
import {
  shouldIncludeToc,
  getSelectedFormat,
  chaptersToPlainText,
  chaptersToHtmlDocument,
  chaptersToTtsText,
  downloadBlob
} from "./exporter.js";
import { checkProxyHealth } from "./fetcher.js";

export function init() {

  /* ===================== PROXY STATUS ===================== */
  (async () => {
    try {
      setProxyStatus("checking");
      const ok = await checkProxyHealth();
      setProxyStatus(ok ? "ok" : "fail");
    } catch {
      setProxyStatus("fail");
    }
  })();

  /* ===================== LOAD STORY ===================== */
  dom.loadBtn.onclick = async () => {
    clearPreview();
    showDownloadSection(false);
    dom.log.innerText = "Starting scrape...";

    try {
      const chapters = await scrapeFromEnd(dom.url.value.trim());

      if (!chapters || !chapters.length) {
        throw new Error("No chapters found");
      }

      cacheStory(chapters);
      renderChapters(chapters);

    } catch (e) {
      dom.log.innerText = "Failed to load story.";
      console.error(e);
    }
  };

  /* ===================== CLEAR CACHE ===================== */
  dom.clearCacheBtn.onclick = () => {
    clearStoryCache();
    clearPreview();
    showDownloadSection(false);
    dom.log.innerText = "Cache cleared.";
  };

  /* ===================== DOWNLOAD ===================== */
  dom.downloadBtn.onclick = () => {
    const chapters = loadCachedStory();
    if (!chapters || !chapters.length) {
      dom.log.innerText = "No cached story available.";
      return;
    }

    const includeToc = shouldIncludeToc();
    const format = getSelectedFormat();

    /* ---------- TXT ---------- */
    if (format === "txt") {
      const text = chaptersToPlainText(chapters, includeToc);
      downloadBlob(text, "text/plain", "txt", chapters);
      return;
    }

    /* ---------- HTML ---------- */
    if (format === "html") {
      const html = chaptersToHtmlDocument(chapters, includeToc);
      downloadBlob(html, "text/html", "html", chapters);
      return;
    }

    /* ---------- MP3 (BROWSER-SAFE) ---------- */
    if (format === "mp3") {
      dom.log.innerText = "Generating MP3…";

      const ttsText = chaptersToTtsText(chapters, includeToc);

      // ✅ Native browser download (no fetch, no blob)
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/tts";
      form.style.display = "none";

      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "text";
      input.value = ttsText;

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      return;
    }
  };

  /* ===================== RESTORE CACHE ===================== */
  const cached = loadCachedStory();
  if (cached?.length) {
    renderChapters(cached);
    showDownloadSection(true);
    dom.log.innerText = "Loaded story from cache.";
  }
}
