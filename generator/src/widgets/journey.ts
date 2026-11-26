import { esc, clip, groupDigits } from "../lib/escape.js";
import { label, svg } from "../lib/svg.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 840;
const H = 270;

/** Year-by-year timeline: contribution bars above the axis, repos started that year below. */
export const journey: SvgWidget = {
  kind: "svg",
  name: "journey",
  alt: "journey timeline",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const nowYear = ctx.now.year;
    const repoYears = ctx.data.repos.map((r) => Number(r.createdAt.slice(0, 4))).filter((y) => y > 2000);
    const startYear = Math.min(nowYear, ctx.data.createdAt ? Number(ctx.data.createdAt.slice(0, 4)) : nowYear, ...repoYears);
    const years = Array.from({ length: nowYear - startYear + 1 }, (_, i) => startYear + i);
    const x0 = 70;
    const x1 = W - 70;
    const step = years.length > 1 ? (x1 - x0) / (years.length - 1) : 0;
    const axisY = 150;
    const totals = years.map((y) => ctx.data.yearTotals[y] ?? 0);
    const max = Math.max(1, ...totals);
    const nodes = years
      .map((y, i) => {
        const x = years.length > 1 ? x0 + i * step : W / 2;
        const d = 0.3 + i * 0.22;
        const v = totals[i];
        const bh = v ? Math.max(4, (v / max) * 72) : 0;
        const started = ctx.data.repos
          .filter((r) => r.createdAt.startsWith(`${y}-`))
          .sort((a, b) => b.stars - a.stars || a.createdAt.localeCompare(b.createdAt));
        const names = started.slice(0, 2).map((r) => clip(r.name, 16));
        const last = y === nowYear;
        return `<g>
${bh ? `<rect x="${x - 14}" y="${axisY - 10 - bh}" width="28" height="${bh.toFixed(1)}" rx="4" fill="${last ? t.accent : t.subtle}" style="transform-box:fill-box;transform-origin:bottom;animation:grow .8s cubic-bezier(.2,.7,.2,1) ${(d + 0.1).toFixed(2)}s both"/>
<text x="${x}" y="${axisY - 16 - bh}" font-size="11" text-anchor="middle" class="${last ? "a b" : "m"} fade" style="animation-delay:${(d + 0.5).toFixed(2)}s">${groupDigits(v)}</text>` : ""}
<circle cx="${x}" cy="${axisY}" r="${last ? 7 : 5}" fill="${last ? t.glow : t.card}" stroke="${last ? t.glow : t.muted}" stroke-width="2" class="fx" style="animation:pop .5s ease ${d.toFixed(2)}s both"/>
${last ? `<circle cx="${x}" cy="${axisY}" r="7" stroke="${t.glow}" class="fx loop" style="animation:ping 1.8s ease-out ${(d + 0.5).toFixed(2)}s infinite"/>` : ""}
<g class="in" style="animation-delay:${(d + 0.1).toFixed(2)}s">
<text x="${x}" y="${axisY + 30}" font-size="15" text-anchor="middle" class="${last ? "a" : "t"} b">${y}</text>
${names.map((n, j) => `<text x="${x}" y="${axisY + 50 + j * 16}" font-size="10.5" text-anchor="middle" class="m">${esc(n)}</text>`).join("")}
${started.length > 2 ? `<text x="${x}" y="${axisY + 82}" font-size="10" text-anchor="middle" class="s">+${started.length - 2} more</text>` : ""}
</g></g>`;
      })
      .join("");
    const lineLen = x1 - x0;
    const css = `@keyframes ping{0%{transform:scale(1);opacity:1}100%{transform:scale(2.6);opacity:0}}
.axis{stroke-dasharray:${lineLen};stroke-dashoffset:${lineLen};animation:draw ${(0.3 + years.length * 0.22).toFixed(2)}s linear .2s forwards}`;
    const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
${label(t, 24, 30, `journey · since ${startYear}`)}
<text x="${W - 24}" y="30" font-size="12" text-anchor="end" class="m">contributions per year · repos started</text>
<path d="M${x0} ${axisY}H${x1}" stroke="${t.border}" stroke-width="2"/>
<path class="axis" d="M${x0} ${axisY}H${x1}" stroke="url(#accentGrad)" stroke-width="2"/>
${nodes}`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, body });
  },
};
