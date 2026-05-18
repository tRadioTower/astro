import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourcePath = path.resolve("downloaded_site/elementlist.html");
const oneColumnPath = path.resolve("src/data/oneColumnElements.js");
const twoColumnPath = path.resolve("src/data/twoColumnElements.js");
const oneColumnDir = path.resolve("src/elements/one-column");
const twoColumnDir = path.resolve("src/elements/two-column");

const html = await readFile(sourcePath, "utf8");
const lines = html.split(/\r?\n/);

const oneStart = findLineIndex(/<h1 class="e-h1--element"># 1カラム用エレメントリスト<\/h1>/);
const twoStart = findLineIndex(/<h1 class="e-h1--element"># 2カラム用エレメントリスト<\/h1>/);
const footerStart = findLineIndex(/<footer class="l-footer">/);

if (oneStart === -1 || twoStart === -1 || footerStart === -1) {
  throw new Error("Could not find expected category boundaries in downloaded_site/elementlist.html");
}

const oneColumnElements = extractElements(oneStart, twoStart);
const twoColumnElements = extractElements(twoStart, footerStart);

await mkdir(path.dirname(oneColumnPath), { recursive: true });
await writeFile(oneColumnPath, toGlobModule("one-column", "oneColumnElements"));
await writeFile(twoColumnPath, toGlobModule("two-column", "twoColumnElements"));
await writeElementFiles(oneColumnDir, oneColumnElements);
await writeElementFiles(twoColumnDir, twoColumnElements);

console.log("Generated element data:");
console.log(`- ${oneColumnPath}`);
console.log(`- ${twoColumnPath}`);
console.log(`- ${oneColumnDir}`);
console.log(`- ${twoColumnDir}`);

function findLineIndex(pattern) {
  return lines.findIndex((line) => pattern.test(line));
}

function extractElements(startLine, endLine) {
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
      blocks.set(key, {
        title: cleanTitle(lines[index]),
        id: cleanId(lines[index]) || slugify(cleanTitle(lines[index])),
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

function filenameFor(element, index) {
  const number = String(index + 1).padStart(3, "0");
  return `${number}-${slugify(element.id || element.title)}.html`;
}

async function writeElementFiles(directory, elements) {
  await mkdir(directory, { recursive: true });
  await Promise.all(
    elements.map((element, index) => (
      writeFile(path.join(directory, filenameFor(element, index)), `${element.html}\n`)
    ))
  );
}

function toGlobModule(category, exportName) {
  return `import { createElements } from "./createElements.js";

const modules = import.meta.glob("../elements/${category}/*.html", {
  query: "?raw",
  import: "default",
  eager: true
});

export const ${exportName} = createElements(modules);
`;
}
