import { oneColumnElements } from "../data/oneColumnElements.js";
import { twoColumnElements } from "../data/twoColumnElements.js";
import "../styles/element-list.css";

export default {
  title: "Element List",
  parameters: {
    layout: "fullscreen"
  }
};

export const All = {
  name: "すべて",
  render: () => renderElementPage([
    { title: "1カラム用エレメント", elements: oneColumnElements, prefix: "one-column" },
    { title: "2カラム用エレメント", elements: twoColumnElements, prefix: "two-column" }
  ])
};

export const OneColumn = {
  name: "1カラム用",
  render: () => renderElementPage([
    { title: "1カラム用エレメント", elements: oneColumnElements, prefix: "one-column" }
  ])
};

export const TwoColumn = {
  name: "2カラム用",
  render: () => renderElementPage([
    { title: "2カラム用エレメント", elements: twoColumnElements, prefix: "two-column" }
  ])
};

function renderElementPage(categories) {
  const page = document.createElement("main");
  page.className = "element-list";

  const header = document.createElement("header");
  header.className = "element-list__header";
  header.innerHTML = '<h1 class="element-list__title">エレメントリスト Storybook</h1>';
  page.append(header);

  categories.forEach((category) => {
    const section = document.createElement("section");
    section.className = "element-category";

    const inner = document.createElement("div");
    inner.className = "element-category__inner";

    const title = document.createElement("h2");
    title.className = "element-category__title";
    title.textContent = category.title;

    const list = document.createElement("div");
    list.className = "element-category__list";

    category.elements.forEach((element, index) => {
      list.append(renderElementCard(element, `${category.prefix}-${index}`));
    });

    inner.append(title, list);
    section.append(inner);
    page.append(section);
  });

  return page;
}

function renderElementCard(element, id) {
  const article = document.createElement("article");
  article.className = "element-card";
  article.id = `storybook-element-${id}`;

  const header = document.createElement("header");
  header.className = "element-card__header";

  const title = document.createElement("h3");
  title.className = "element-card__title";
  title.textContent = element.title;

  const button = document.createElement("button");
  button.className = "element-card__copy";
  button.type = "button";
  button.textContent = "コピー";

  const preview = document.createElement("div");
  preview.className = "element-card__preview";
  preview.innerHTML = element.html;

  const details = document.createElement("details");
  details.className = "element-card__source";
  details.open = true;

  const summary = document.createElement("summary");
  summary.textContent = "ソースコード";

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = element.html;
  pre.append(code);
  details.append(summary, pre);

  const textarea = document.createElement("textarea");
  textarea.className = "element-card__clipboard";
  textarea.readOnly = true;
  textarea.value = element.html;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(element.html);
    } catch {
      textarea.select();
      document.execCommand("copy");
    }

    button.textContent = "コピー済み";
    window.setTimeout(() => {
      button.textContent = "コピー";
    }, 1400);
  });

  header.append(title, button);
  article.append(header, preview, details, textarea);

  return article;
}
