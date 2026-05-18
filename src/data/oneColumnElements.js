import { createElements } from "./createElements.js";

const modules = import.meta.glob("../elements/one-column/*.html", {
  query: "?raw",
  import: "default",
  eager: true
});

export const oneColumnElements = createElements(modules);
