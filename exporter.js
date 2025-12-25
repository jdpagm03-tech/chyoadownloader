import { dom } from "./dom.js";

/* ===================== HELPERS ===================== */
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

/* ===================== OPTIONS ===================== */
export function shouldIncludeToc() {
  return document.querySelector('input[name="toc"]:checked')?.value !== "no";
}

export function getSelectedFormat() {
  return document.querySelector('input[name="format"]:checked')?.value || "html";
}

export function getFilename(ext, chapters) {
  const base = dom.filename.value.trim() || buildAutoName(chapters);
  return `${base}.${ext}`;
}

/* ===================== EXPORTS ===================== */
export function chaptersToPlainText(chapters, includeToc) {
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

export function chaptersToHtmlDocument(chapters, includeToc) {
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

export function chaptersToTtsText(chapters, includeToc) {
  const parts = [];

  if (includeToc) {
    parts.push("Table of Contents.");
    chapters.forEach((c, i) =>
      parts.push(`Chapter ${i + 1}. ${c.title}.`)
    );
  }

  chapters.forEach((c, i) => {
    const d = document.createElement("div");
    d.innerHTML = c.body;
    parts.push(`Chapter ${i + 1}. ${c.title}.`);
    parts.push(d.innerText.replace(/\n+/g, " "));
  });

  return parts.join("\n\n");
}

export function downloadBlob(data, type, ext, chapters) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = getFilename(ext, chapters);
  a.click();
}
