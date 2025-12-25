export function sanitize(str) {
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildAutoName(chapters) {
  if (!chapters?.length) return "chyoa_story";
  return `${sanitize(chapters[0].title)}-${sanitize(chapters.at(-1).title)}`;
}
