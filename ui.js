import { dom } from "./dom.js";

export function showDownloadSection(visible) {
  dom.downloadSection.hidden = !visible;
}

export function renderChapters(chapters) {
  dom.preview.innerHTML = chapters.map((c, i) => `
    <div class="chapter">
      <h3>${c.title}</h3>
      ${c.body}
    </div>
  `).join("");
}

export function clearPreview() {
  dom.preview.innerHTML = "";
  dom.progress.innerText = "";
}

/* ✅ NEU: Proxy Status UI */
export function setProxyStatus(state) {
  if (!dom.proxyStatus) return;

  let text = "";
  let cls = "";

  switch (state) {
    case "ok":
      text = "OK";
      cls = "ok";
      break;
    case "fail":
      text = "UNAVAILABLE";
      cls = "fail";
      break;
    default:
      text = "checking…";
      cls = "checking";
  }

  dom.proxyStatus.innerHTML = `Proxy Status: <span class="${cls}">${text}</span>`;
}
