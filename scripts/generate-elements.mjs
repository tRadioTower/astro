import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourcePath = path.resolve("downloaded_site/elementlist.html");
const commonCssPath = path.resolve("public/common/css/common.css");
const elementsDir = path.resolve("src/elements");
const UTILITY_SAMPLE_TEXT =
  "これは折り返し表示を確認するためのサンプルテキストです。日本語の文章が複数行になった場合の余白、幅、行間、文字サイズ、配置の見え方を確認できます。ボタンやリンクの中でも読みやすさを比較できます。";
const SPLIT_BY_HEADING_TITLES = new Set([
  "H1見出し＋リード文",
  "Figure / Grid",
  "リスト",
  "Anchor link",
  "Pagination",
  "アコーディオン",
  "Table",
  "Attention",
  "Inquiry",
  "Related Link",
  "ステップ（矢印）"
]);

const categoryDefinitions = [
  {
    id: "foundation",
    file: "01-foundation.html",
    title: "基本要素",
    match: ["H1見出し＋リード文", "本文", "リスト", "Link", "Icon", "Tag"]
  },
  {
    id: "layout",
    file: "02-layout.html",
    title: "レイアウト",
    match: ["Figure / Grid", "Frame", "ダミー領域"]
  },
  {
    id: "navigation",
    file: "03-navigation.html",
    title: "ナビゲーション",
    match: [
      "下層ページへのリンク",
      "下層ページへのリンク（画像付き）",
      "下層ページへのリンク(2カラム)",
      "Tab",
      "Anchor link",
      "Pagination",
      "アコーディオン",
      "サイドナビ"
    ]
  },
  {
    id: "actions",
    file: "04-actions.html",
    title: "アクション",
    match: ["検索ボックス", "Button", "Conversion", "Inquiry"]
  },
  {
    id: "content",
    file: "05-content.html",
    title: "コンテンツ",
    match: ["サービス一覧", "News", "Related Link", "キャンペーン用バナー（単体表示）"]
  },
  {
    id: "data-table",
    file: "06-data-table.html",
    title: "表・データ",
    match: ["帳票ダウンロード", "Table", "金融機関のテーブル"]
  },
  {
    id: "media",
    file: "07-media.html",
    title: "メディア・ロゴ",
    match: ["提携先等ロゴ一覧"]
  },
  {
    id: "notice",
    file: "08-notice.html",
    title: "注意・ステップ",
    match: ["Step", "ステップ（矢印）", "Attention"]
  }
];
const utilityCategoryDefinitions = [
  {
    id: "utilities-spacing",
    file: "09-utilities-spacing.html",
    title: "ユーティリティ: 余白",
    test: (name) => /^u-[mp][trbl]?--/.test(name)
  },
  {
    id: "utilities-width",
    file: "10-utilities-width.html",
    title: "ユーティリティ: 幅",
    test: (name) => /^u-w--|^u-h--/.test(name)
  },
  {
    id: "utilities-type",
    file: "11-utilities-type.html",
    title: "ユーティリティ: 文字・色",
    test: (name) => /^u-c--|^u-font--|^u-lh--|^u-en$|^u-break-|^u-left|^u-center|^u-right/.test(name)
  },
  {
    id: "utilities-layout",
    file: "12-utilities-layout.html",
    title: "ユーティリティ: レイアウト",
    test: (name) => /^u-display--|^u-float--|^u-hidden-|^u-clearfix|^u-fixed$|^u-relative$|^u-nowrap/.test(name)
  },
  {
    id: "utilities-other",
    file: "13-utilities-other.html",
    title: "ユーティリティ: その他",
    test: () => true
  }
];
const commonClassCategoryDefinitions = [
  {
    id: "common-layout",
    file: "14-common-layout.html",
    title: "Common CSS: レイアウト",
    test: (name) => /^l-/.test(name)
  },
  {
    id: "common-component",
    file: "15-common-component.html",
    title: "Common CSS: コンポーネント",
    test: (name) => /^c-/.test(name)
  },
  {
    id: "common-element",
    file: "16-common-element.html",
    title: "Common CSS: エレメント",
    test: (name) => /^e-/.test(name)
  },
  {
    id: "common-module",
    file: "17-common-module.html",
    title: "Common CSS: モジュール",
    test: (name) => /^m-/.test(name)
  },
  {
    id: "common-state",
    file: "18-common-state.html",
    title: "Common CSS: 状態・JS",
    test: (name) => /^is-|^js-/.test(name)
  },
  {
    id: "common-other",
    file: "19-common-other.html",
    title: "Common CSS: その他",
    test: () => true
  }
];

const html = await readFile(sourcePath, "utf8");
const lines = html.split(/\r?\n/);

const oneStart = findLineIndex(/<h1 class="e-h1--element"># 1カラム用エレメントリスト<\/h1>/);
const twoStart = findLineIndex(/<h1 class="e-h1--element"># 2カラム用エレメントリスト<\/h1>/);
const footerStart = findLineIndex(/<footer class="l-footer">/);

if (oneStart === -1 || twoStart === -1 || footerStart === -1) {
  throw new Error("Could not find expected category boundaries in downloaded_site/elementlist.html");
}

const extractedElements = [
  ...extractElements(oneStart, twoStart, "one-column"),
  ...extractElements(twoStart, footerStart, "two-column")
];

await mkdir(elementsDir, { recursive: true });

const generatedCategories = [];

for (const category of categoryDefinitions) {
  const elements = extractedElements
    .filter((element) => matchesCategory(element, category))
    .flatMap((element) => splitElement(element));
  await writeFile(path.join(elementsDir, category.file), renderCategoryFile(category, elements));
  generatedCategories.push(category);
}

const commonCss = await readFile(commonCssPath, "utf8");

for (const category of createUtilityCategories(commonCss)) {
  await writeFile(path.join(elementsDir, category.file), renderCategoryFile(category, category.elements));
  generatedCategories.push(category);
}

for (const category of createCommonClassCategories(commonCss)) {
  await writeFile(path.join(elementsDir, category.file), renderCategoryFile(category, category.elements));
  generatedCategories.push(category);
}

console.log("Generated categorized element files:");
for (const category of generatedCategories) {
  console.log(`- ${path.join(elementsDir, category.file)}`);
}

function findLineIndex(pattern) {
  return lines.findIndex((line) => pattern.test(line));
}

function extractElements(startLine, endLine, layout) {
  const blocks = new Map();

  for (let index = startLine; index < endLine; index += 1) {
    if (!/class="[^"]*e-h2--element/.test(lines[index])) {
      continue;
    }

    const block = findBlock(index, startLine, endLine);
    if (!block) {
      continue;
    }

    const key = `${block.start}:${block.end}`;
    if (!blocks.has(key)) {
      const title = cleanTitle(lines[index]);
      blocks.set(key, {
        title,
        id: cleanId(lines[index]) || slugify(title),
        layout,
        html: lines.slice(block.start, block.end + 1).join("\n").trim()
      });
    }
  }

  return Array.from(blocks.values());
}

function findBlock(lineIndex, startLine, endLine) {
  const startMatchers = [
    /<div class="c-unit(?:\s|")/,
    /<header class="c-unit(?:\s|")/,
    /<aside class="l-content__sub(?:\s|")/
  ];
  const endMatchers = [
    /<\/div><!-- \/.c-unit -->/,
    /<\/header><!-- \/.c-unit -->/,
    /<\/aside>/
  ];

  let start = -1;
  let startMatcherIndex = -1;

  for (let index = lineIndex; index >= startLine; index -= 1) {
    const found = startMatchers.findIndex((matcher) => matcher.test(lines[index]));
    if (found !== -1) {
      start = index;
      startMatcherIndex = found;
      break;
    }
  }

  if (start === -1) {
    return null;
  }

  for (let index = lineIndex; index < endLine; index += 1) {
    if (endMatchers[startMatcherIndex].test(lines[index])) {
      return { start, end: index };
    }
  }

  return null;
}

function matchesCategory(element, category) {
  return category.match.includes(element.title);
}

function splitElement(element) {
  if (element.title === "Link") {
    return uniquifyTitles(splitLinkElement(element));
  }

  if (element.title === "Button") {
    return uniquifyTitles(splitButtonElement(element));
  }

  if (element.title === "サービス一覧") {
    return uniquifyTitles(splitRepeatedBlocks(element, "div", /m-service(?:\s|")/, "サービス"));
  }

  if (element.title === "News") {
    return uniquifyTitles(splitNewsElement(element));
  }

  if (element.title === "Conversion") {
    return uniquifyTitles(splitRepeatedBlocks(element, "div", /m-conversion__col(?:--download)?(?:\s|")/, "Conversion"));
  }

  if (element.title === "帳票ダウンロード") {
    return uniquifyTitles(splitRepeatedBlocks(element, "tr", /PDF形式|target="_blank"|e-table-download/i, "帳票ダウンロード", false));
  }

  if (element.title === "金融機関のテーブル") {
    return uniquifyTitles(splitRepeatedBlocks(element, "div", /m-fee-table__col(?:\s|")/, "金融機関テーブル"));
  }

  if (element.title === "提携先等ロゴ一覧") {
    return uniquifyTitles(splitRepeatedBlocks(element, "div", /m-look-atm(?:--noimage)?__col(?:\s|")/, "提携先ロゴ"));
  }

  if (element.title === "Tag") {
    return uniquifyTitles(splitRepeatedBlocks(element, "li", /e-tag__item/, "Tag"));
  }

  if (element.title === "Step") {
    return uniquifyTitles(splitRepeatedBlocks(element, "ol", /m-step(?:\s|")/, "Step"));
  }

  if (SPLIT_BY_HEADING_TITLES.has(element.title)) {
    return uniquifyTitles(splitByHeadings(element));
  }

  if (element.title === "下層ページへのリンク") {
    return uniquifyTitles(splitRepeatedBlocks(element, "li", /m-list-navi__item/, "下層ページへのリンク"));
  }

  if (element.title === "下層ページへのリンク（画像付き）") {
    return uniquifyTitles(splitRepeatedBlocks(element, "li", /m-list-navi--img__item/, "下層ページへのリンク（画像付き）"));
  }

  if (element.title === "下層ページへのリンク(2カラム)") {
    return uniquifyTitles(splitRepeatedBlocks(element, "li", /m-list-navi__item/, "下層ページへのリンク(2カラム)"));
  }

  return [element];
}

function splitLinkElement(element) {
  const lines = element.html.split(/\r?\n/);
  const parts = [
    ...extractMatchingTagBlocks(lines, "p", /e-link--txt/).map((html) => ({
      ...element,
      title: linkTitle(html, "本文内リンク"),
      id: slugify(linkTitle(html, "本文内リンク")),
      html
    })),
    ...extractMatchingTagBlocks(lines, "li", /e-link--/).map((html) => ({
      ...element,
      title: linkTitle(html, "リンク"),
      id: slugify(linkTitle(html, "リンク")),
      html
    })),
    ...extractMatchingTagBlocks(lines, "a", /e-link--alert/).map((html) => ({
      ...element,
      title: "アラートリンク",
      id: "alert-link",
      html
    }))
  ];

  return parts.length > 0 ? parts : [element];
}

function splitButtonElement(element) {
  const lines = element.html.split(/\r?\n/);
  const parts = extractMatchingTagBlocks(lines, "div", /m-btn-wrap/, /m-btn-wrap/).map((html) => {
    const title = buttonTitle(html);
    return {
      ...element,
      title,
      id: slugify(title),
      html
    };
  });

  return parts.length > 0 ? parts : [element];
}

function splitByHeadings(element) {
  const lines = element.html.split(/\r?\n/);
  const headingIndexes = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const isHeading =
      /<h3\b/i.test(line) ||
      /<h2\b[^>]*class="[^"]*e-h2--element/i.test(line);
    const isTopHeading = index === findFirstElementHeadingIndex(lines);

    if (isHeading && !isTopHeading) {
      headingIndexes.push(index);
    }
  }

  if (headingIndexes.length === 0) {
    return [element];
  }

  return headingIndexes.map((start, index) => {
    const sectionBlock = findContainingSectionBlock(lines, start);
    const end = headingIndexes[index + 1] ?? findClosingLine(lines);
    const html = sectionBlock
      ? sectionBlock
      : cleanFragmentLines(lines.slice(start, end)).join("\n").trim();
    const subtitle = cleanTitle(lines[start]);
    const title = `${element.title} - ${subtitle}`;

    return {
      ...element,
      title,
      id: cleanId(lines[start]) || slugify(title),
      html,
      copy: sourceHtmlForElement(title, html)
    };
  });
}

function sourceHtmlForElement(title, html) {
  if (title.endsWith(" - リード文")) {
    return extractFirstTagBlock(html, "p", /e-txt--lead/);
  }

  return "";
}

function splitRepeatedBlocks(element, tag, pattern, titlePrefix, requireStartMatch = true) {
  const lines = element.html.split(/\r?\n/);
  const parts = extractMatchingTagBlocks(lines, tag, pattern, requireStartMatch ? pattern : null).map((html) => {
    const label = firstReadableText(html) || titlePrefix;
    const title = `${titlePrefix} - ${label}`;
    return {
      ...element,
      title,
      id: slugify(title),
      html
    };
  });

  return parts.length > 0 ? parts : [element];
}

function splitNewsElement(element) {
  const lines = element.html.split(/\r?\n/);
  const parts = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!/<dt\b[^>]*class="[^"]*m-news__date/i.test(lines[index])) {
      continue;
    }

    const ddStart = lines.findIndex((line, cursor) => cursor > index && /<dd\b[^>]*class="[^"]*m-news__txt/i.test(line));

    if (ddStart === -1) {
      continue;
    }

    let ddEnd = ddStart;
    for (let cursor = ddStart; cursor < lines.length; cursor += 1) {
      ddEnd = cursor;
      if (/<\/dd>/.test(lines[cursor])) {
        break;
      }
    }

    const html = lines.slice(index, ddEnd + 1).join("\n").trim();
    const title = linkTitle(html, "Newsリンク");
    parts.push({
      ...element,
      title,
      id: slugify(title),
      html
    });
    index = ddEnd;
  }

  return parts.length > 0 ? parts : [element];
}

function extractMatchingTagBlocks(lines, tag, contentPattern, startPattern = null) {
  const blocks = [];
  const openPattern = new RegExp(`<${tag}\\b`, "gi");
  const closePattern = new RegExp(`</${tag}>`, "gi");

  for (let index = 0; index < lines.length; index += 1) {
    if (!new RegExp(`<${tag}\\b`, "i").test(lines[index])) {
      continue;
    }

    if (startPattern) {
      startPattern.lastIndex = 0;
      if (!startPattern.test(lines[index])) {
        continue;
      }
    }

    let depth = 0;
    let end = index;

    for (let cursor = index; cursor < lines.length; cursor += 1) {
      depth += countMatches(lines[cursor], openPattern);
      depth -= countMatches(lines[cursor], closePattern);
      end = cursor;

      if (depth <= 0) {
        break;
      }
    }

    const html = lines.slice(index, end + 1).join("\n").trim();
    contentPattern.lastIndex = 0;

    if (contentPattern.test(html)) {
      blocks.push(html);
    }

    index = end;
  }

  return blocks;
}

function extractFirstTagBlock(html, tag, contentPattern) {
  return extractMatchingTagBlocks(html.split(/\r?\n/), tag, contentPattern).at(0) || "";
}

function countMatches(value, pattern) {
  pattern.lastIndex = 0;
  return Array.from(String(value).matchAll(pattern)).length;
}

function findFirstElementHeadingIndex(lines) {
  return lines.findIndex((line) => /<h2\b[^>]*class="[^"]*e-h2--element/i.test(line));
}

function findClosingLine(lines) {
  const closingIndex = lines.findIndex((line) => /<\/div><!-- \/.c-unit -->|<\/header><!-- \/.c-unit -->|<\/aside>/.test(line));
  return closingIndex === -1 ? lines.length : closingIndex;
}

function findContainingSectionBlock(lines, headingIndex) {
  let start = -1;

  for (let index = headingIndex; index >= 0; index -= 1) {
    if (/<section\b[^>]*class="[^"]*c-section--h3/i.test(lines[index])) {
      start = index;
      break;
    }

    if (/<h[1-6]\b/i.test(lines[index]) && index !== headingIndex) {
      break;
    }
  }

  if (start === -1) {
    return "";
  }

  for (let index = headingIndex; index < lines.length; index += 1) {
    if (/<\/section><!-- \/.c-section--h3 -->/.test(lines[index])) {
      return lines.slice(start, index + 1).join("\n").trim();
    }
  }

  return "";
}

function cleanFragmentLines(fragmentLines) {
  const lines = [...fragmentLines];
  const boundaryPattern =
    /^\s*(<section\b[^>]*class="[^"]*c-section--h3[^"]*"[^>]*>|<\/section><!-- \/.c-section--h3 -->|<\/section><!-- \/.c-section--h2 -->|<\/div><!-- \/.c-section__inner -->|<\/div><!-- \/.c-unit -->|<\/div><!-- \/.c-unit__inner -->)\s*$/;

  while (lines.length > 0 && boundaryPattern.test(lines[lines.length - 1])) {
    lines.pop();
  }

  return lines;
}

function linkTitle(html, fallback) {
  const text = firstReadableText(html);
  const suffix = text.length > 42 ? "（長文）" : "";

  if (/img_icon_pdf|pdf形式|PDF/i.test(html)) {
    return `PDFリンク${suffix}`;
  }

  if (/img_icon_zip|zip形式|ZIP/i.test(html)) {
    return `ZIPダウンロードリンク${suffix}`;
  }

  if (/e-link--anchor/.test(html)) {
    return "ページ内リンク";
  }

  if (/e-link--alert/.test(html)) {
    return "アラートリンク";
  }

  if (/target="_blank"/i.test(html)) {
    return `${fallback}（別タブ）${suffix}`;
  }

  return `${fallback}（同タブ）${suffix}`;
}

function buttonTitle(html) {
  const suffix = /target="_blank"/i.test(html) ? "（別タブ）" : "";

  if (/e-btn--bdr-white/.test(html)) {
    return `白枠ボタン${suffix}`;
  }

  if (/e-btn--white/.test(html)) {
    return `白ボタン${suffix}`;
  }

  if (/e-btn--bdr/.test(html)) {
    return `枠線ボタン${suffix}`;
  }

  if (/e-btn--in-table/.test(html)) {
    return `表内ボタン${suffix}`;
  }

  return `塗りボタン${suffix}`;
}

function firstReadableText(html) {
  return cleanTitle(html)
    .replace(/\s+/g, " ")
    .slice(0, 48)
    .trim();
}

function uniquifyTitles(elements) {
  const counts = new Map();

  return elements.map((element) => {
    const count = counts.get(element.title) || 0;
    counts.set(element.title, count + 1);

    if (count === 0) {
      return element;
    }

    const title = `${element.title} ${count + 1}`;
    return {
      ...element,
      title,
      id: slugify(title)
    };
  });
}

function createUtilityCategories(css) {
  const utilities = extractCssClasses(css).filter((cssClass) => cssClass.name.startsWith("u-"));
  const categories = utilityCategoryDefinitions.map((category) => ({
    ...category,
    elements: []
  }));

  for (const utility of utilities) {
    const category = categories.find((candidate) => candidate.test(utility.name));
    category.elements.push(renderUtilityElement(utility));
  }

  return categories.filter((category) => category.elements.length > 0);
}

function createCommonClassCategories(css) {
  const cssClasses = extractCssClasses(css).filter((cssClass) => !cssClass.name.startsWith("u-"));
  const categories = commonClassCategoryDefinitions.map((category) => ({
    ...category,
    elements: []
  }));

  for (const cssClass of cssClasses) {
    const category = categories.find((candidate) => candidate.test(cssClass.name));
    category.elements.push(renderCommonClassElement(cssClass));
  }

  return categories.filter((category) => category.elements.length > 0);
}

function extractCssClasses(css) {
  const classes = new Map();
  const cleanCss = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@charset\s+[^;]+;/g, "");
  const rulePattern = /([^{}]+)\{([^{}]+)\}/g;

  for (const match of cleanCss.matchAll(rulePattern)) {
    const selector = normalizeSelector(match[1]);
    const declarations = normalizeDeclarations(match[2]);

    if (!selector || selector.startsWith("@") || !declarations) {
      continue;
    }

    for (const classMatch of selector.matchAll(/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g)) {
      const name = classMatch[1];
      if (!classes.has(name)) {
        classes.set(name, {
          name,
          declarations,
          rules: []
        });
      }
      classes.get(name).rules.push({ selector, declarations });
    }
  }

  return Array.from(classes.values()).sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

function normalizeSelector(source) {
  return source
    .split(",")
    .map((selector) => selector.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join(",\n");
}

function normalizeDeclarations(source) {
  return source
    .split(";")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `${line};`)
    .join("\n");
}

function renderUtilityElement(utility) {
  const declarations = utility.declarations || utility.rules[0]?.declarations || "";

  return {
    title: `.${utility.name}`,
    id: slugify(utility.name),
    copy: `class="${utility.name}"`,
    html: [
      `<div class="utility-class">`,
      `  <p class="utility-class__name"><code>.${escapeHtml(utility.name)}</code></p>`,
      `  <pre class="utility-class__rule"><code>${escapeHtml(declarations)}</code></pre>`,
      `  <div class="utility-class__demo">`,
      `    <span class="utility-class__sample ${escapeHtml(utility.name)}">${escapeHtml(UTILITY_SAMPLE_TEXT)}</span>`,
      `  </div>`,
      `</div>`
    ].join("\n")
  };
}

function renderCommonClassElement(cssClass) {
  const sampleHtml = renderCommonClassSampleHtml(cssClass.name);

  return {
    title: `.${cssClass.name}`,
    id: slugify(cssClass.name),
    copy: sampleHtml,
    html: [
      `<div class="css-class-reference">`,
      `  <p class="css-class-reference__name"><code>.${escapeHtml(cssClass.name)}</code></p>`,
      `  <div class="css-class-reference__demo">`,
      indent(renderCommonClassPreviewHtml(cssClass.name, sampleHtml)),
      `  </div>`,
      `  <pre class="css-class-reference__rule"><code>${escapeHtml(renderCssRules(cssClass.rules))}</code></pre>`,
      `</div>`
    ].join("\n")
  };
}

function renderCommonClassSampleHtml(className) {
  return `<div class="${escapeAttr(className)}">${escapeHtml(UTILITY_SAMPLE_TEXT)}</div>`;
}

function renderCommonClassPreviewHtml(className, sampleHtml) {
  return `<iframe class="css-class-reference__frame" title=".${escapeAttr(className)} preview" srcdoc="${escapeAttr(renderPreviewDocument(sampleHtml))}"></iframe>`;
}

function renderPreviewDocument(sampleHtml) {
  return [
    `<!doctype html>`,
    `<html lang="ja">`,
    `<head>`,
    `<meta charset="utf-8">`,
    `<link rel="stylesheet" href="/common/css/common.css">`,
    `<style>`,
    `html, body { margin: 0; min-height: 100%; background: #fff; }`,
    `body { box-sizing: border-box; padding: 12px; color: #1f2328; font: 16px/1.6 sans-serif; }`,
    `img { max-width: 100%; height: auto; }`,
    `</style>`,
    `</head>`,
    `<body>`,
    sampleHtml,
    `</body>`,
    `</html>`
  ].join("");
}

function renderCssRules(rules) {
  const uniqueRules = [];
  const seen = new Set();

  for (const rule of rules) {
    const key = `${rule.selector}\n${rule.declarations}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    uniqueRules.push(rule);
  }

  const visibleRules = uniqueRules.slice(0, 6);
  const snippets = visibleRules.map((rule) => `${rule.selector} {\n${indent(rule.declarations)}\n}`);

  if (uniqueRules.length > visibleRules.length) {
    snippets.push(`/* 他 ${uniqueRules.length - visibleRules.length} 件の関連ルール */`);
  }

  return snippets.join("\n\n");
}

function indent(source) {
  return source
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

function renderCategoryFile(category, elements) {
  const header = [
    `<!--`,
    `  category: ${category.title}`,
    `  usage: Add one template block per element. Preview HTML goes in template, copy HTML goes in data-element-copy.`,
    `-->`
  ].join("\n");

  const templates = elements.map((element) => renderTemplate(category, element)).join("\n\n");
  return `${header}\n\n${templates}\n`;
}

function renderTemplate(_category, element) {
  const copySource = element.copy || element.html;

  return `<template>
${element.html}
${renderCopyBlock(copySource)}
</template>`;
}

function renderCopyBlock(source) {
  return `<script type="text/plain" data-element-copy>
${String(source).trim()}
</script>`;
}

function cleanTitle(line) {
  return line
    .replace(/<[^>]*>/g, "")
    .trim()
    .replace(/^#\s*/, "")
    .replace(/&amp;/g, "&")
    .replace(/&#9312;/g, "①")
    .replace(/&#9313;/g, "②")
    .trim();
}

function cleanId(line) {
  const match = line.match(/\sid="([^"]+)"/);
  return match?.[1] ?? "";
}

function slugify(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9ぁ-んァ-ン一-龠ー]+/g, "-")
    .replace(/^-+|-+$/g, "") || "element";
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
