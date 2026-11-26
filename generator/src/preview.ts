import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config.js";
import type { ProfileData } from "./data/types.js";
import { DIST } from "./index.js";
import { layout } from "./readme.js";
import { widgets } from "./widgets/index.js";

/** dist/preview.html: the README layout rendered from local files, dark and light side by side. */
export function writePreview(data: ProfileData): string {
  const rows = layout(data, config);
  const column = (theme: "dark" | "light") =>
    rows
      .map(
        (row) =>
          `<p align="center">${row
            .map((i) => {
              const ext = widgets.find((w) => w.name === i.name)?.kind ?? "svg";
              const size = i.height ? `height="${i.height}"` : `width="${i.width ?? "100%"}"`;
              return `<img src="${i.name}-${theme}.${ext}" ${size} alt="${i.name}">`;
            })
            .join(" ")}</p>`,
      )
      .join("\n");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Profile preview</title>
<style>body{margin:0;display:flex;flex-wrap:wrap;font-family:system-ui}section{flex:1 1 880px;max-width:880px;margin:0 auto;padding:24px 20px;box-sizing:border-box}
.dark{background:#0d1117}.light{background:#fff}p{margin:0 0 8px}img{max-width:100%}</style></head>
<body><section class="dark">${column("dark")}</section><section class="light">${column("light")}</section></body></html>`;
  const file = join(DIST, "preview.html");
  writeFileSync(file, html);
  return file;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const data = JSON.parse(readFileSync(join(DIST, "data.json"), "utf8")) as ProfileData;
  console.log(writePreview(data));
}
