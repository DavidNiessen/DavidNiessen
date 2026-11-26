import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config.js";
import { derive } from "./data/derive.js";
import { loadData } from "./data/index.js";
import { localParts } from "./lib/astro.js";
import { themeList } from "./theme.js";
import { widgets } from "./widgets/index.js";
import type { Ctx } from "./widgets/types.js";

export const DIST = new URL("../dist/", import.meta.url).pathname;
const LIMITS = { svg: 1.5 * 1024 * 1024, gif: 4 * 1024 * 1024 };

export function assetName(widget: string, theme: string, ext: "svg" | "gif"): string {
  return `${widget}-${theme}.${ext}`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mock = args.includes("--mock");
  const only = args.find((a) => a.startsWith("--only="))?.slice(7).split(",");
  const nowArg = args.find((a) => a.startsWith("--now="))?.slice(6);
  const date = nowArg ? new Date(nowArg) : new Date();
  const data = await loadData({ mock, now: date });
  console.log(`data source: ${data.source}, ${data.weeks.length} weeks, ${data.lastYearTotal} contributions in the last year`);
  const d = derive(data);
  if (!only) rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  writeFileSync(join(DIST, "data.json"), JSON.stringify(data, null, 2));
  const errors: string[] = [];
  for (const w of widgets) {
    if (only && !only.includes(w.name)) continue;
    for (const theme of themeList) {
      const ctx: Ctx = { theme, data, d, now: localParts(date), date, config, run: process.env.GITHUB_RUN_NUMBER ?? null };
      const ext = w.kind;
      const file = join(DIST, assetName(w.name, theme.name, ext));
      const started = performance.now();
      writeFileSync(file, w.render(ctx));
      const size = statSync(file).size;
      const ms = performance.now() - started;
      console.log(`  ${assetName(w.name, theme.name, ext).padEnd(32)} ${(size / 1024).toFixed(1).padStart(8)} KB ${ms.toFixed(0).padStart(6)} ms`);
      if (size > LIMITS[ext]) errors.push(`${file} is ${(size / 1024 / 1024).toFixed(2)} MB (limit ${LIMITS[ext] / 1024 / 1024} MB)`);
    }
  }
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
