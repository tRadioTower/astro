import { createElementCategories } from "./createElements.js";

const modules = import.meta.glob("../elements/*.html", {
  query: "?raw",
  import: "default",
  eager: true
});

export const elementCategories = createElementCategories(modules);
