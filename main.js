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
import { checkProxyHealth } from "./fetcher.js";
import {
  shouldIncludeToc,
  getSelectedFormat,
  chaptersToPlainText,
  chaptersToHtmlDocument,
  chaptersToTtsText,
  downloadBlob
} from "./exporter.js";

export function init() {

  /* ===================== PROXY STATUS ===================== */
  (async () => {
    setProxyStatus("checking");
    const ok = await checkProxyHealth();
    setProxyStatus(ok ? "ok" : "fail");
  })();

  /* ===================== LOAD STORY ===================== */
  dom.loadBtn.onclick = async () => {
    clearPreview();
    showDownloadSection(false);
    dom.log.innerText = "Starting scrape...";

    try {
      const chapters = await scrapeFromEnd(dom.url.value.trim());
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
  dom.downloadBtn.onclick = async () => {
    const chapters = loadCachedStory();
    if (!chapters) return;

    const includeToc = shouldIncludeToc();
    const format = getSelectedFormat();

    try {
      if (format === "txt") {
        downloadBlob(
          chaptersToPlainText(chapters, includeToc),
          "text/plain",
          "txt",
          chapters
        );
        return;
      }

      if (format === "html") {
        downloadBlob(
          chaptersToHtmlDocument(chapters, includeToc),
          "text/html",
          "html",
          chapters
        );
        return;
      }

      if (format === "mp3") {
        dom.log.innerText = "Generating MP3 via TTS…";

        const res = await fetch("/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: chaptersToTtsText(chapters, includeToc)
          })
        });

        if (!res.ok) throw new Error("TTS failed");

        downloadBlob(await res.blob(), "audio/mpeg", "mp3", chapters);
      }

    } catch (e) {
      dom.log.innerText = "Download failed.";
      console.error(e);
    }
  };

  /* ===================== RESTORE (JETZT KORREKT) ===================== */
  const cached = loadCachedStory();
  if (cached?.length) {
    renderChapters(cached);
    showDownloadSection(true);
    dom.log.innerText = "Loaded story from cache.";
  }
}
