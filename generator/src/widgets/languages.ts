import { esc, num } from "../lib/escape.js";
import { label, svg } from "../lib/svg.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 410;
const H = 300;

export const languages: SvgWidget = {
  kind: "svg",
  name: "languages",
  alt: "most used languages",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const fallback = [t.accent, t.glow, "#f87171", "#7f1d1d", t.muted, t.subtle];
    const all = ctx.data.languages;
    const total = all.reduce((a, l) => a + l.bytes, 0) || 1;
    const top = all.slice(0, 5);
    const rest = all.slice(5).reduce((a, l) => a + l.bytes, 0);
    const rows = [...top.map((l, i) => ({ ...l, color: l.color || fallback[i] })), ...(rest > 0 ? [{ name: "Other", color: t.subtle, bytes: rest }] : [])];
    const cx = 108;
    const cy = 168;
    const r = 70;
    const C = 2 * Math.PI * r;
    let acc = 0;
    const segs = rows
      .map((l, i) => {
        const frac = l.bytes / total;
        const len = Math.max(0, frac * C - 3);
        const start = acc;
        acc += frac * C;
        const d = 0.3 + i * 0.22;
        return `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${l.color}" stroke-width="20" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-start).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})" style="--len:${len.toFixed(1)};stroke-dasharray:0 ${C.toFixed(1)};animation:seg .7s cubic-bezier(.2,.7,.2,1) ${d.toFixed(2)}s forwards"/>`;
      })
      .join("");
    const css = rows.length
      ? `@keyframes seg{to{stroke-dasharray:var(--len) ${C.toFixed(1)}}}
.spinring{transform-origin:${cx}px ${cy}px;animation:spin 20s linear infinite}`
      : "";
    const lead = rows[0];
    const legend = rows
      .map((l, i) => {
        const y = 82 + i * 34;
        const pct = (l.bytes / total) * 100;
        const bw = Math.max(3, (pct / ((rows[0].bytes / total) * 100)) * 150);
        const d = 0.5 + i * 0.12;
        return `<g class="in" style="animation-delay:${d.toFixed(2)}s">
<rect x="214" y="${y - 9}" width="8" height="8" rx="2" fill="${l.color}"/>
<text x="230" y="${y}" font-size="12" class="t b">${esc(l.name)}</text>
<text x="386" y="${y}" font-size="12" text-anchor="end" class="m">${num(pct, 1)}%</text>
<rect x="214" y="${y + 7}" width="172" height="3" rx="1.5" fill="${t.raised}"/>
<rect x="214" y="${y + 7}" width="${bw.toFixed(1)}" height="3" rx="1.5" fill="${l.color}" style="transform-box:fill-box;transform-origin:left;animation:growX .9s cubic-bezier(.2,.7,.2,1) ${(d + 0.2).toFixed(2)}s both"/>
</g>`;
      })
      .join("");
    const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
${label(t, 24, 30, "languages")}
<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${t.raised}" stroke-width="20"/>
<g class="spinring loop"><circle cx="${cx}" cy="${cy}" r="${r + 17}" stroke="${t.subtle}" stroke-dasharray="2 9"/></g>
${segs}
${lead ? `<text x="${cx}" y="${cy - 2}" font-size="24" text-anchor="middle" class="t b fade" style="animation-delay:1.2s">${num((lead.bytes / total) * 100, 0)}%</text>
<text x="${cx}" y="${cy + 18}" font-size="11" text-anchor="middle" class="m fade" style="animation-delay:1.3s">${esc(lead.name)}</text>` : `<text x="${cx}" y="${cy}" text-anchor="middle" class="m">no data</text>`}
${legend}
<text x="24" y="${H - 18}" font-size="10" class="m">by bytes across ${ctx.data.repoCount} owned repositories</text>`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, body });
  },
};
