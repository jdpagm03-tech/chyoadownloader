import { dom } from "./dom.js";
import { showDownloadSection } from "./ui.js";

let cachedStory = null;

/* ===================== CACHE ===================== */
export function cacheStory(chapters) {
  cachedStory = chapters;

  // ✅ Cache-Clear-Flag entfernen (neuer Cache)
  localStorage.removeItem("cachedStoryCleared");

  localStorage.setItem("cachedStory", JSON.stringify(chapters));
  showDownloadSection(true);
  dom.log.innerText = "Story cached locally.";
}

export function loadCachedStory() {
  // ✅ WICHTIG: Wenn User Cache bewusst gelöscht hat → NICHT reloaden
  if (localStorage.getItem("cachedStoryCleared") === "true") {
    return null;
  }

  if (!cachedStory) {
    const raw = localStorage.getItem("cachedStory");
    if (raw) {
      try {
        cachedStory = JSON.parse(raw);
      } catch {
        cachedStory = null;
      }
    }
  }

  return cachedStory;
}

/* ✅ FINALER CLEAR CACHE (wirklich final) */
export function clearStoryCache() {
  cachedStory = null;

  localStorage.removeItem("cachedStory");
  localStorage.setItem("cachedStoryCleared", "true");
}
