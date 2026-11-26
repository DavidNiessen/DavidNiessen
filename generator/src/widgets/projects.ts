import { esc, wrap } from "../lib/escape.js";
import { svg } from "../lib/svg.js";
import { glyph } from "./parts.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 410;
const H = 168;
/** GitHub allows up to six pinned items. */
export const PROJECT_SLOTS = 6;

/** Card for pinned repository number `index` (empty slots render a placeholder and are left out of the README). */
function projectCard(index: number): SvgWidget {
  return {
    kind: "svg",
    name: `project-${index + 1}`,
    alt: `project ${index + 1}`,
    render(ctx: Ctx) {
      const t = ctx.theme;
      const p = ctx.data.projects[index];
      const perim = 2 * (W - 2 + H - 2);
      const css = `.run{stroke-dasharray:90 ${perim - 90};animation:runB 6s linear ${(-index * 1.5).toFixed(1)}s infinite}
@keyframes runB{to{stroke-dashoffset:-${perim}}}
.tw{transform-box:fill-box;transform-origin:center;animation:tw 2.6s ease-in-out ${(index * 0.4).toFixed(1)}s infinite}
@keyframes tw{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.25) rotate(20deg)}}`;
      if (!p) {
        const body = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="${t.card}" stroke="${t.border}" stroke-dasharray="4 6"/>
<text x="${W / 2}" y="${H / 2 + 4}" font-size="13" text-anchor="middle" class="m">next project loading…</text>`;
        return svg({ width: W, height: H, theme: t, title: "upcoming project", css, body, fonts: [400] });
      }
      const lines = wrap(p.description || "No description yet.", 50, 3);
      const no = String(index + 1).padStart(2, "0");
      const body = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="${t.card}" stroke="${t.border}"/>
<rect class="run loop" x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" stroke="url(#accentGrad)" stroke-width="1.5" stroke-linecap="round"/>
<text x="${W - 22}" y="48" font-size="40" text-anchor="end" class="b" fill="${t.subtle}" opacity=".5">${no}</text>
<g class="in" style="animation-delay:${(0.1 + index * 0.1).toFixed(2)}s">
${glyph("repo", 22, 22, 16, t.accent)}
<text x="46" y="35" font-size="16" class="t b">${esc(p.name)}</text>
${lines.map((l, i) => `<text x="22" y="${66 + i * 18}" font-size="12" class="m">${esc(l)}</text>`).join("")}
</g>
<g class="in" style="animation-delay:${(0.3 + index * 0.1).toFixed(2)}s">
<path d="M22 ${H - 40}H${W - 22}" stroke="${t.border}"/>
${p.language ? `<circle cx="28" cy="${H - 20}" r="5" fill="${p.language.color || t.accent}"/><text x="40" y="${H - 15.5}" font-size="12" class="t">${esc(p.language.name)}</text>` : ""}
<g class="tw loop">${glyph("star", W - 128, H - 28, 14, t.glow)}</g>
<text x="${W - 108}" y="${H - 15.5}" font-size="12" class="t">${p.stars}</text>
${glyph("pr", W - 74, H - 28, 14, t.muted)}
<text x="${W - 54}" y="${H - 15.5}" font-size="12" class="t">${p.forks}</text>
</g>`;
      return svg({ width: W, height: H, theme: t, title: p.name, css, body, fonts: [400, 700] });
    },
  };
}

export const projects: SvgWidget[] = Array.from({ length: PROJECT_SLOTS }, (_, i) => projectCard(i));
