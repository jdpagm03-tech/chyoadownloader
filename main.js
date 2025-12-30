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
  downloadBlob,
  getFilename
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
  dom.downloadBtn.onclick = async () => {
    const chapters = loadCachedStory();
    if (!chapters || !chapters.length) {
      dom.log.innerText = "No cached story available.";
      return;
    }

    const includeToc = shouldIncludeToc();
    const format = getSelectedFormat();

    try {
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

      /* ---------- MP3 (PRO-LEVEL STREAMING) ---------- */
      if (format === "mp3") {
        dom.log.innerText = "Generating MP3 (streaming by chapter)…";

        // ✅ Kapitelweise Texte vorbereiten
        const chapterTexts = chapters.map((c, i) => {
          const d = document.createElement("div");
          d.innerHTML = c.body;
          return `Chapter ${i + 1}. ${c.title}. ${d.innerText}`;
        });

        // ✅ Download sofort vorbereiten
        const a = document.createElement("a");
        a.download = getFilename("mp3", chapters);

        fetch("/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapters: chapterTexts })
        })
          .then(res => {
            if (!res.ok) throw new Error("TTS request failed");
            return res.blob();
          })
          .then(blob => {
            a.href = URL.createObjectURL(blob);
            a.click();
            dom.log.innerText = "MP3 download started.";
          })
          .catch(err => {
            dom.log.innerText = "MP3 generation failed.";
            console.error(err);
          });

        return;
      }

    } catch (e) {
      dom.log.innerText = "Download failed.";
      console.error(e);
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
