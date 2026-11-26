import { yearProgress } from "../lib/astro.js";
import { esc, groupDigits } from "../lib/escape.js";
import { odometer, odometerWidth } from "../lib/odometer.js";
import { label, svg } from "../lib/svg.js";
import { glyph, type GlyphName } from "./parts.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 840;
const H = 250;

interface Tile {
  label: string;
  value: number;
  unit?: string;
  glyph: GlyphName;
  extra?: (x: number, y: number, w: number, h: number) => string;
}

export const stats: SvgWidget = {
  kind: "svg",
  name: "stats",
  alt: "GitHub stats",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const { data, d } = ctx;
    const weekly = d.weekly.slice(-10);
    const wMax = Math.max(1, ...weekly);
    const last7 = d.days.slice(-7);

    const spark = (x: number, y: number, w: number, h: number) => {
      const bw = 4;
      const gap = 2;
      const x0 = x + w - weekly.length * (bw + gap) - 12;
      return weekly
        .map((v, i) => {
          const bh = Math.max(2, (v / wMax) * 30);
          return `<rect x="${x0 + i * (bw + gap)}" y="${y + h - 16 - bh}" width="${bw}" height="${bh.toFixed(1)}" rx="1.5" fill="${i === weekly.length - 1 ? t.accent : t.subtle}" class="fx" style="transform-origin:bottom;transform-box:fill-box;animation:grow .7s cubic-bezier(.2,.7,.2,1) ${(0.8 + i * 0.04).toFixed(2)}s both"/>`;
        })
        .join("");
    };
    const week = (x: number, y: number, w: number, h: number) =>
      last7
        .map((day, i) => {
          const s = 10;
          const cx = x + w - 7 * (s + 3) - 12 + i * (s + 3);
          return `<rect x="${cx}" y="${y + h - 16 - s}" width="${s}" height="${s}" rx="2.5" fill="${day.count > 0 ? t.heat[Math.max(2, day.level)] : t.heat[0]}" class="fx" style="animation:pop .5s ease ${(1 + i * 0.08).toFixed(2)}s both"/>`;
        })
        .join("");

    const candidates: (Tile | null)[] = [
      { label: `contributions ${ctx.now.year}`, value: data.yearTotal, glyph: "bolt", extra: spark },
      { label: "all-time", value: data.allTimeTotal, glyph: "sigma" },
      { label: "current streak", value: d.streaks.current, unit: "d", glyph: "flame", extra: week },
      { label: "longest streak", value: d.streaks.longest, unit: "d", glyph: "trophy" },
      data.totals.pullRequests !== null ? { label: "pull requests", value: data.totals.pullRequests, glyph: "pr" } : null,
      data.totals.stars !== null ? { label: "stars earned", value: data.totals.stars, glyph: "star" } : null,
      data.totals.reviews !== null ? { label: "code reviews", value: data.totals.reviews, glyph: "eye" } : null,
      { label: "followers", value: data.followers, glyph: "users" },
      { label: "repositories", value: data.repoCount, glyph: "repo" },
    ];
    const tiles = candidates.filter((x): x is Tile => x !== null).slice(0, 6);

    const gx = 24;
    const gy = 50;
    const tw = 186;
    const th = 88;
    const gap = 12;
    const tileMarkup = tiles
      .map((tile, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = gx + col * (tw + gap);
        const y = gy + row * (th + gap);
        const delay = 0.15 + i * 0.1;
        const value = groupDigits(tile.value);
        return `<g class="in" style="animation-delay:${delay.toFixed(2)}s">
<rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="10" fill="${t.raised}" stroke="${t.border}"/>
${glyph(tile.glyph, x + 14, y + 13, 15, t.accent)}
<text x="${x + 36}" y="${y + 25}" font-size="10.5" letter-spacing="1" class="m">${esc(tile.label.toUpperCase())}</text>
${odometer(value, { x: x + 14, y: y + 66, fontSize: 28, delay: delay + 0.2 })}
${tile.unit ? `<text x="${x + 18 + odometerWidth()}" y="${y + 66}" font-size="15" class="m">${tile.unit}</text>` : ""}
${tile.extra ? tile.extra(x, y, tw, th) : ""}
</g>`;
      })
      .join("\n");

    // year progress ring
    const yp = yearProgress(ctx.now);
    const cx = 708;
    const cy = 142;
    const r = 66;
    const C = 2 * Math.PI * r;
    const ticks = Array.from({ length: 52 }, (_, i) => {
      const a = (i / 52) * 360;
      const done = i / 52 <= yp.fraction;
      return `<line x1="${cx}" y1="${cy - r - 12}" x2="${cx}" y2="${cy - r - (i % 13 === 0 ? 20 : 16)}" stroke="${done ? t.accent : t.subtle}" stroke-width="${i % 13 === 0 ? 2 : 1.2}" transform="rotate(${a.toFixed(1)} ${cx} ${cy})" class="fade" style="animation-delay:${(0.6 + i * 0.015).toFixed(2)}s"/>`;
    }).join("");
    const pct = (yp.fraction * 100).toFixed(1);
    const css = `
.ring{stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${C.toFixed(1)};animation:ringTo 2.2s cubic-bezier(.2,.7,.2,1) .5s forwards}
@keyframes ringTo{to{stroke-dashoffset:${(C * (1 - yp.fraction)).toFixed(1)}}}
.orb{transform-origin:${cx}px ${cy}px;animation:orb 2.2s cubic-bezier(.2,.7,.2,1) .5s both}
@keyframes orb{from{transform:rotate(0)}to{transform:rotate(${(yp.fraction * 360).toFixed(1)}deg)}}
.sweep{transform-origin:${cx}px ${cy}px;animation:spin 6s linear infinite}`;
    const defs = `<linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.glow}"/><stop offset="1" stop-color="#7f1d1d"/></linearGradient>
<linearGradient id="sweepG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.accent}" stop-opacity="0"/><stop offset="1" stop-color="${t.accent}" stop-opacity=".35"/></linearGradient>`;
    const ring = `<g class="in" style="animation-delay:.3s">
<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${t.heat[0]}" stroke-width="10"/>
<circle class="ring" cx="${cx}" cy="${cy}" r="${r}" stroke="url(#ringG)" stroke-width="10" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
<g class="orb"><circle cx="${cx}" cy="${cy - r}" r="7" fill="${t.glow}" filter="url(#glow)"/><circle cx="${cx}" cy="${cy - r}" r="3" fill="#fff"/></g>
<g class="sweep loop"><path d="M${cx} ${cy}L${cx} ${cy - r + 10}A${r - 10} ${r - 10} 0 0 1 ${(cx + (r - 10) * Math.sin(Math.PI / 5)).toFixed(1)} ${(cy - (r - 10) * Math.cos(Math.PI / 5)).toFixed(1)}Z" fill="url(#sweepG)" opacity=".5"/></g>
${ticks}
${odometer(pct, { x: cx - 8, y: cy + 8, fontSize: 26, anchor: "middle", delay: 0.6 })}
<text x="${cx + pct.length * 7.8 - 2}" y="${cy + 8}" font-size="15" class="m">%</text>
<text x="${cx}" y="${cy + 30}" font-size="10.5" letter-spacing="1" text-anchor="middle" class="m">DAY ${yp.dayOfYear}/${yp.daysInYear}</text>
<text x="${cx}" y="${cy - 22}" font-size="10.5" letter-spacing="1.5" text-anchor="middle" class="a b">${ctx.now.year}</text>
</g>`;

    const body = `${`<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>`}
${label(t, 24, 30, "stats · live from github")}
${tileMarkup}
${ring}`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, defs, body });
  },
};
