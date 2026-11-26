import { esc } from "../lib/escape.js";
import { label, svg } from "../lib/svg.js";
import { glyph, type GlyphName } from "./parts.js";
import { chronotype } from "./rhythm.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 410;
const H = 300;

export interface Trophy {
  name: string;
  glyph: GlyphName;
  /** 0 = locked, 1..3 = tier */
  tier: number;
  hint: string;
}

const tierOf = (v: number, steps: [number, number, number]) => (v >= steps[2] ? 3 : v >= steps[1] ? 2 : v >= steps[0] ? 1 : 0);

export function computeTrophies(ctx: Ctx): Trophy[] {
  const { data, d } = ctx;
  const years = data.createdAt ? ctx.now.year - Number(data.createdAt.slice(0, 4)) : 0;
  const langs = data.languages.length;
  const hours = data.commitHours;
  const owl = hours ? chronotype(hours) : null;
  return [
    { name: "Streaker", glyph: "flame", tier: tierOf(d.streaks.longest, [7, 14, 30]), hint: `${d.streaks.longest}d best` },
    { name: "Centurion", glyph: "bolt", tier: tierOf(d.bestMonth?.total ?? 0, [50, 100, 200]), hint: `${d.bestMonth?.total ?? 0} in a month` },
    { name: "Polyglot", glyph: "code", tier: tierOf(langs, [3, 5, 8]), hint: `${langs} languages` },
    { name: "Veteran", glyph: "trophy", tier: tierOf(years, [2, 4, 6]), hint: `${years} yrs on GH` },
    { name: "Shipper", glyph: "rocket", tier: tierOf(data.repoCount, [10, 25, 50]), hint: `${data.repoCount} repos` },
    { name: "Stargazer", glyph: "star", tier: tierOf(data.totals.stars ?? 0, [5, 20, 100]), hint: `${data.totals.stars ?? 0} stars` },
    { name: owl === "early bird" ? "Early Bird" : owl === "night owl" ? "Night Owl" : "9 to 5", glyph: "moon", tier: owl === "night owl" || owl === "early bird" ? 2 : hours ? 1 : 0, hint: owl ?? "unknown" },
    { name: "Consistent", glyph: "calendar", tier: tierOf(d.active, [100, 200, 300]), hint: `${d.active} active days` },
  ];
}

function hex(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

export const trophies: SvgWidget = {
  kind: "svg",
  name: "trophies",
  alt: "achievements",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const list = computeTrophies(ctx);
    const unlocked = list.filter((x) => x.tier > 0).length;
    const items = list
      .map((tr, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const cx = 58 + col * 98;
        const cy = 100 + row * 104;
        const on = tr.tier > 0;
        const d = 0.2 + i * 0.1;
        const id = `hx${i}`;
        const stroke = tr.tier === 3 ? t.glow : on ? t.accent : t.subtle;
        return `<g class="fx" style="animation:pop .55s cubic-bezier(.3,1.4,.5,1) ${d.toFixed(2)}s both;transform-origin:${cx}px ${cy}px;transform-box:view-box">
<clipPath id="${id}"><polygon points="${hex(cx, cy, 30)}"/></clipPath>
<polygon points="${hex(cx, cy, 30)}" fill="${on ? t.raised : t.card}" stroke="${stroke}" stroke-width="${on ? 2 : 1}" ${on ? "" : 'stroke-dasharray="3 3"'}/>
${on ? `<g clip-path="url(#${id})"><rect x="${cx - 60}" y="${cy - 40}" width="22" height="80" fill="#fff" opacity="${t.name === "dark" ? 0.12 : 0.6}" transform="skewX(-20)" class="loop" style="animation:shine 4s ease-in-out ${(1.5 + i * 0.35).toFixed(2)}s infinite"/></g>` : ""}
${glyph(tr.glyph, cx - 11, cy - 13, 22, on ? (tr.tier === 3 ? t.glow : t.accent) : t.subtle)}
${on ? `<text x="${cx}" y="${cy + 20}" font-size="8.5" text-anchor="middle" class="b" fill="${stroke}">${"I".repeat(tr.tier)}</text>` : `<text x="${cx}" y="${cy + 20}" font-size="8.5" text-anchor="middle" class="s">LOCKED</text>`}
<text x="${cx}" y="${cy + 46}" font-size="11" text-anchor="middle" class="${on ? "t b" : "m"}">${esc(tr.name)}</text>
<text x="${cx}" y="${cy + 60}" font-size="9" text-anchor="middle" class="m">${esc(tr.hint)}</text>
</g>`;
      })
      .join("");
    const css = `@keyframes shine{0%{transform:translateX(0) skewX(-20deg)}40%,100%{transform:translateX(140px) skewX(-20deg)}}`;
    const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
${label(t, 24, 30, "achievements")}
<text x="${W - 24}" y="30" font-size="12" text-anchor="end" class="m">${unlocked}/${list.length} unlocked</text>
${items}`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, body });
  },
};
