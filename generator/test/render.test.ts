import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { config } from "../src/config.js";
import { derive } from "../src/data/derive.js";
import { mockData } from "../src/data/mock.js";
import { localParts } from "../src/lib/astro.js";
import { renderReadme } from "../src/readme.js";
import { themeList } from "../src/theme.js";
import { widgets } from "../src/widgets/index.js";
import type { Ctx } from "../src/widgets/types.js";

const date = new Date("2026-11-27T02:17:00Z");
const data = mockData(date);
const ctx = (i: number): Ctx => ({ theme: themeList[i], data, d: derive(data), now: localParts(date), date, config, run: "42" });

describe("svg widgets", () => {
  for (const w of widgets.filter((x) => x.kind === "svg")) {
    it(`${w.name} renders valid, self-contained SVG in both themes`, () => {
      for (let i = 0; i < themeList.length; i++) {
        const out = w.render(ctx(i)) as string;
        expect(XMLValidator.validate(out)).toBe(true);
        expect(out.length).toBeLessThan(1.5 * 1024 * 1024);
        // no external references: GitHub's image proxy would block them
        expect(out).not.toMatch(/(href|src)="https?:/);
      }
    });
  }

  it("still renders with sparse (scraped) data", () => {
    const sparse = { ...data, commitHours: null, weather: null, events: [], projects: [], languages: [], totals: { ...data.totals, pullRequests: null, reviews: null, stars: null } };
    const c: Ctx = { ...ctx(0), data: sparse, d: derive(sparse) };
    for (const w of widgets.filter((x) => x.kind === "svg")) expect(XMLValidator.validate(w.render(c) as string)).toBe(true);
  });
});

describe("readme", () => {
  it("references every widget in both themes and contains no visible text", () => {
    const md = renderReadme(data, config);
    const used = widgets.filter((w) => !/^project-(\d)$/.test(w.name) || Number(w.name.slice(8)) <= data.projects.length);
    expect(used.length).toBeLessThanOrEqual(widgets.length);
    for (const w of used) {
      expect(md).toContain(`${w.name}-dark.${w.kind}`);
      expect(md).toContain(`${w.name}-light.${w.kind}`);
    }
    for (const p of data.projects) expect(md).toContain(`href="${p.url}"`);
    const visible = md.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, "").trim();
    expect(visible).toBe("");
  });
});
