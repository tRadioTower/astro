export function createElementCategories(modules) {
  return Object.entries(modules)
    .sort(([a], [b]) => a.localeCompare(b, "ja"))
    .map(([file, html]) => {
      const source = String(html);
      const category = categoryFromFile(file);

      return {
        ...category,
        elements: extractTemplates(source, category.id)
      };
    })
    .filter((category) => category.elements.length > 0);
}

function extractTemplates(source, categoryId) {
  return Array.from(source.matchAll(/<template\b([^>]*)>([\s\S]*?)<\/template>/gi)).map((match, index) => {
    const attrs = parseAttrs(match[1]);
    const html = match[2].trim();
    const title = attrs["data-title"] || extractTitle(html) || `Element ${index + 1}`;
    const id = attrs["data-id"] || extractId(html) || slugify(title);
    const source = attrs["data-copy"] || html;

    return {
      id,
      title,
      categoryId,
      description: attrs["data-description"] || "",
      html,
      source
    };
  });
}

function parseAttrs(source) {
  const attrs = {};
  for (const match of source.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g)) {
    attrs[match[1]] = decodeAttr(match[2] ?? match[3] ?? "");
  }
  return attrs;
}

function decodeAttr(value) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function extractTitle(html) {
  const heading =
    html.match(/<h[1-6][^>]*class="[^"]*e-h[12]--element[^"]*"[^>]*>([\s\S]*?)<\/h[1-6]>/i) ||
    html.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
  return cleanText(heading?.[1] || "");
}

function extractId(html) {
  const heading =
    html.match(/<h[1-6][^>]*class="[^"]*e-h[12]--element[^"]*"[^>]*>/i) ||
    html.match(/<h[1-6][^>]*>/i);
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

function categoryFromFile(file) {
  const basename = file
    .split("/")
    .pop()
    .replace(/\.html$/, "");
  const id = basename.replace(/^\d+-/, "");
  const fallbackTitle = id.replace(/-/g, " ");
  const title = CATEGORY_TITLES[id] || fallbackTitle;

  return { id, title };
}

function slugify(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9ぁ-んァ-ン一-龠ー]+/g, "-")
    .replace(/^-+|-+$/g, "") || "element";
}

const CATEGORY_TITLES = {
  foundation: "基本要素",
  layout: "レイアウト",
  navigation: "ナビゲーション",
  actions: "アクション",
  content: "コンテンツ",
  "data-table": "表・データ",
  media: "メディア・ロゴ",
  notice: "注意・ステップ",
  "utilities-spacing": "ユーティリティ: 余白",
  "utilities-width": "ユーティリティ: 幅",
  "utilities-type": "ユーティリティ: 文字・色",
  "utilities-layout": "ユーティリティ: レイアウト",
  "utilities-other": "ユーティリティ: その他",
  sandbox: "検証・一時置き場"
};
