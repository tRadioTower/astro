import { createElements } from "./createElements.js";

const modules = import.meta.glob("../elements/two-column/*.html", {
  query: "?raw",
  import: "default",
  eager: true
});

export const twoColumnElements = createElements(modules);
