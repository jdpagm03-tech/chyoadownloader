/* ===================== SINGLE PROXY ===================== */
const PROXY = url =>
  `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

/* ===================== STATE ===================== */
let cachedStory = null;

/* ===================== DOM ===================== */
const dom = {
  loadBtn: document.getElementById("loadBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  downloadSection: document.getElementById("downloadSection"),
  preview: document.getElementById("preview"),
  progress: document.getElementById("progress"),
  log: document.getElementById("log"),
  filename: document.getElementById("filename"),
  url: document.getElementById("url")
};

/* ===================== UI ===================== */
function showDownloadSection(visible) {
  dom.downloadSection.hidden = !visible;
}

/* ===================== CACHE ===================== */
function cacheStory(chapters) {
  cachedStory = chapters;
  localStorage.setItem("cachedStory", JSON.stringify(chapters));
  showDownloadSection(true);
  dom.log.innerText = "Story cached locally.";
}

function loadCachedStory() {
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

/* ===================== RENDER ===================== */
function renderChapters(chapters) {
  dom.preview.innerHTML = chapters.map((c, i) => `
    <div class="chapter" id="chapter-${i + 1}">
      <div class="chapter-title">${c.title}</div>
      ${c.body}
    </div>
  `).join("");
}

/* ===================== FETCH (FRONTEND VIA PROXY) ===================== */
async function fetchViaProxy(url) {
  const res = await fetch(PROXY(url));
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status}`);
  }

  const json = await res.json();
  if (!json?.contents) {
    throw new Error("Empty proxy response");
  }

  return json.contents;
}

/* ===================== SCRAPER ===================== */
async function scrapeFromEnd(startUrl) {
  let chapters = [];
  let current = startUrl;
  let visited = new Set();
  let attempts = 0;

  while (current && !visited.has(current)) {
    dom.progress.innerText = `Chapters fetched: ${chapters.length}`;
    dom.log.innerText = `Fetching:\n${current}`;

    try {
      const html = await fetchViaProxy(current);
      const doc = new DOMParser().parseFromString(html, "text/html");

      const title = doc.querySelector("h1")?.innerText.trim();
      const bodyEl = doc.querySelector(
        ".chapter-body, .chapter-content, article.story-text, .inner-content"
      );

      if (!title || !bodyEl) {
        throw new Error("Invalid chapter structure");
      }

      visited.add(current);
      chapters.push({ title, body: bodyEl.innerHTML });

      let prev =
        doc.querySelector(".breadcrumb li:nth-last-child(2) a")?.href ||
        doc.querySelector("a.back-button, a[aria-label='Back']")?.href ||
        [...doc.querySelectorAll("a")]
          .find(a =>
            a.textContent.trim().toLowerCase() === "previous chapter"
          )?.href;

      if (prev?.startsWith("/")) {
        prev = "https://chyoa.com" + prev;
      }

      current = prev || null;
      attempts = 0;

      // kleine Pause, um Proxy nicht zu stressen
      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      attempts++;
      dom.log.innerText = "Fetch failed, retrying...";
      console.error(err);

      if (attempts >= 10) {
        dom.log.innerText = "Too many failures. Stopping safely.";
        break;
      }

      await new Promise(r => setTimeout(r, 600));
    }
  }

  return chapters.reverse();
}

/* ===================== FILENAME ===================== */
function sanitize(str) {
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAutoName(chapters) {
  if (!chapters?.length) return "chyoa_story";
  return `${sanitize(chapters[0].title)}-${sanitize(chapters.at(-1).title)}`;
}

function getFilename(ext, chapters) {
  const base = dom.filename.value.trim() || buildAutoName(chapters);
  return `${base}.${ext}`;
}

/* ===================== EXPORT HELPERS ===================== */
function shouldIncludeToc() {
  return document.querySelector('input[name="toc"]:checked')?.value !== "no";
}

function chaptersToPlainText(chapters, includeToc) {
  const toc = includeToc
    ? "Table of Contents\n" +
      chapters.map((c, i) => `${i + 1}. ${c.title}`).join("\n") +
      "\n\n"
    : "";

  const body = chapters.map(c => {
    const d = document.createElement("div");
    d.innerHTML = c.body;
    return `${c.title}\n\n${d.innerText}`;
  }).join("\n\n");

  return toc + body;
}

function chaptersToHtmlDocument(chapters, includeToc) {
  const toc = includeToc ? `
<nav class="toc">
  <h2>Table of Contents</h2>
  <ol>
    ${chapters.map((c, i) =>
      `<li><a href="#chapter-${i + 1}">${c.title}</a></li>`
    ).join("")}
  </ol>
</nav>` : "";

  const sections = chapters.map((c, i) => `
<section id="chapter-${i + 1}">
  <h2>${c.title}</h2>
  ${c.body}
</section>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${dom.filename.value.trim() || "CHYOA Story"}</title>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
.toc { background:#f5f5f5; padding:15px; margin-bottom:20px; }
section { margin-bottom:40px; }
section h2 { border-bottom:1px solid #ccc; padding-bottom:5px; }
</style>
</head>
<body>
${toc}
${sections}
</body>
</html>`;
}

/* ===================== TTS TEXT ===================== */
function chaptersToTtsText(chapters, includeToc) {
  const parts = [];

    if (includeToc) {
    parts.push("Table of Contents.");
    chapters.forEach((c, i) => {
      parts.push(`Chapter ${i + 1}. ${c.title}.`);
    });
  }

  chapters.forEach((c, i) => {
    const d = document.createElement("div");
    d.innerHTML = c.body;
    parts.push(`Chapter ${i + 1}. ${c.title}.`);
    parts.push(d.innerText.replace(/\n+/g, " "));
  });

  return parts.join("\n\n");
}

function getSelectedFormat() {
  return document.querySelector('input[name="format"]:checked')?.value || "html";
}

/* ===================== DOWNLOAD ===================== */
function downloadBlob(data, type, ext, chapters) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = getFilename(ext, chapters);
  a.click();
}

/* ===================== EVENTS ===================== */
export function initEvents() {

  dom.loadBtn.onclick = async () => {
    dom.preview.innerHTML = "";
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

  dom.downloadBtn.onclick = async () => {
    const chapters = loadCachedStory();
    if (!chapters) return;

    const includeToc = shouldIncludeToc();
    const format = getSelectedFormat();

    try {
      if (format === "txt") {
        const text = chaptersToPlainText(chapters, includeToc);
        downloadBlob(text, "text/plain", "txt", chapters);
        return;
      }

      if (format === "html") {
        const html = chaptersToHtmlDocument(chapters, includeToc);
        downloadBlob(html, "text/html", "html", chapters);
        return;
      }

      if (format === "mp3") {
        dom.log.innerText = "Generating MP3 via TTS…";

        const ttsText = chaptersToTtsText(chapters, includeToc);
        const res = await fetch("/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: ttsText })
        });

        if (!res.ok) {
          throw new Error("TTS request failed");
        }

        const blob = await res.blob();
        downloadBlob(blob, "audio/mpeg", "mp3", chapters);
      }

    } catch (e) {
      dom.log.innerText = "Download failed.";
      console.error(e);
    }
  };

  /* ===================== RESTORE ===================== */
  const cached = loadCachedStory();
  if (cached?.length) {
    renderChapters(cached);
    showDownloadSection(true);
    dom.log.innerText = "Loaded story from cache.";
  }
}
