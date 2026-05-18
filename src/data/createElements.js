export function createElements(modules) {
  return Object.entries(modules)
    .sort(([a], [b]) => a.localeCompare(b, "ja"))
    .map(([file, html]) => {
      const source = String(html).trim();
      const title = extractTitle(source) || titleFromFile(file);

      return {
        title,
        id: extractId(source) || slugify(title),
        html: source
      };
    });
}

function extractTitle(html) {
  const heading = html.match(/<h[1-6][^>]*class="[^"]*e-h[12]--element[^"]*"[^>]*>([\s\S]*?)<\/h[1-6]>/i);
  return cleanText(heading?.[1] || "");
}

function extractId(html) {
  const heading = html.match(/<h[1-6][^>]*class="[^"]*e-h[12]--element[^"]*"[^>]*>/i);
  const id = heading?.[0].match(/\sid="([^"]+)"/i);
  return id?.[1] || "";
}

function cleanText(value) {
  return value
    .replace(/<[^>]*>/g, "")
    .trim()
    .replace(/^#\s*/, "")
    .replace(/&amp;/g, "&")
    .replace(/&#9312;/g, "①")
    .replace(/&#9313;/g, "②")
    .trim();
}

function titleFromFile(file) {
  return file
    .split("/")
    .pop()
    .replace(/^\d+-/, "")
    .replace(/\.html$/, "")
    .replace(/-/g, " ");
}

function slugify(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9ぁ-んァ-ン一-龠ー]+/g, "-")
    .replace(/^-+|-+$/g, "") || "element";
}
