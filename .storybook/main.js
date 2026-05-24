import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const downloadedSite = path.resolve(dirname, "../downloaded_site");
const staticDirs = ["../public"];

if (existsSync(downloadedSite)) {
  staticDirs.push({ from: "../downloaded_site", to: "/" });
}

export default {
  stories: ["../src/**/*.stories.@(js|mjs)"],
  addons: [],
  framework: {
    name: "@storybook/html-vite",
    options: {}
  },
  staticDirs
};
