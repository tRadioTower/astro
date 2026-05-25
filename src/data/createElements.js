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
  const usedIds = new Map();

  return Array.from(source.matchAll(/<template\b([^>]*)>([\s\S]*?)<\/template>/gi)).map((match, index) => {
    const attrs = parseAttrs(match[1]);
    const rawHtml = match[2].trim();
    const copyBlock = extractCopyBlock(rawHtml);
    const html = removeCopyBlocks(rawHtml).trim();
    const title = attrs["data-title"] || extractTitle(html, copyBlock) || `Element ${index + 1}`;
    const id = uniqueId(attrs["data-id"] || extractId(html) || slugify(title), usedIds);
    const source = formatHtmlSource(attrs["data-copy"] || copyBlock || html);

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

function uniqueId(baseId, usedIds) {
  const id = baseId || "element";
  const count = usedIds.get(id) || 0;
  usedIds.set(id, count + 1);
  return count === 0 ? id : `${id}-${count + 1}`;
}

function extractCopyBlock(source) {
  const match = source.match(COPY_BLOCK_PATTERN);
  return match?.[1]?.trim() || "";
}

function removeCopyBlocks(source) {
  return source.replace(COPY_BLOCK_PATTERN_GLOBAL, "").trim();
}

function formatHtmlSource(source) {
  const value = String(source).trim();
  const tokens = Array.from(value.matchAll(/<!--[\s\S]*?-->|<!doctype[^>]*>|<\/?[^>]+>|[^<]+/gi)).map((match) => match[0]);

  if (tokens.length === 0) {
    return value;
  }

  const lines = [];
  let depth = 0;

  for (const token of tokens) {
    const trimmed = token.trim();

    if (!trimmed) {
      continue;
    }

    if (isClosingTag(trimmed)) {
      depth = Math.max(depth - 1, 0);
    }

    if (isHtmlTag(trimmed)) {
      lines.push(`${"  ".repeat(depth)}${trimmed}`);
    } else {
      for (const textLine of trimmed.split(/\r?\n/)) {
        const text = textLine.trim();
        if (text) {
          lines.push(`${"  ".repeat(depth)}${text}`);
        }
      }
    }

    if (isOpeningTag(trimmed)) {
      depth += 1;
    }
  }

  return lines.join("\n");
}

function isHtmlTag(value) {
  return value.startsWith("<") && value.endsWith(">");
}

function isClosingTag(value) {
  return /^<\//.test(value);
}

function isOpeningTag(value) {
  if (!/^<[A-Za-z][^>]*>$/.test(value) || /\/>$/.test(value)) {
    return false;
  }

  const tagName = value.match(/^<([A-Za-z][\w:-]*)/)?.[1]?.toLowerCase();
  return Boolean(tagName && !VOID_TAGS.has(tagName));
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

function extractTitle(html, copyBlock = "") {
  const heading =
    html.match(/<h[1-6][^>]*class="[^"]*e-h[12]--element[^"]*"[^>]*>([\s\S]*?)<\/h[1-6]>/i) ||
    html.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
  return (
    cleanText(heading?.[1] || "") ||
    extractCodeTitle(html) ||
    extractClassTitle(copyBlock || html) ||
    extractTextTitle(copyBlock || html)
  );
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

function extractCodeTitle(html) {
  const code = html.match(/<code[^>]*>\s*(\.[^<\s]+)\s*<\/code>/i);
  return cleanText(code?.[1] || "");
}

function extractClassTitle(html) {
  const classAttr = html.match(/\sclass="([^"]+)"/i);
  const className = classAttr?.[1]?.trim().split(/\s+/).find(Boolean);
  return className ? `.${className}` : "";
}

function extractTextTitle(html) {
  return cleanText(html).slice(0, 48).trim();
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

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

const COPY_BLOCK_PATTERN = /<script\b(?=[^>]*\bdata-element-copy\b)[^>]*>([\s\S]*?)<\/script>/i;
const COPY_BLOCK_PATTERN_GLOBAL = /<script\b(?=[^>]*\bdata-element-copy\b)[^>]*>[\s\S]*?<\/script>/gi;

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
  "common-layout": "Common CSS: レイアウト",
  "common-component": "Common CSS: コンポーネント",
  "common-element": "Common CSS: エレメント",
  "common-module": "Common CSS: モジュール",
  "common-state": "Common CSS: 状態・JS",
  "common-other": "Common CSS: その他",
  sandbox: "検証・一時置き場"
};
