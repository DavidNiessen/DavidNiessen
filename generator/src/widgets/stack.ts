import { esc } from "../lib/escape.js";
import { icon, iconSvg } from "../lib/icons.js";
import { label, svg } from "../lib/svg.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 840;
const H = 380;
const CX = 590;
const CY = 205;
const RADII = [78, 124, 170];
const PERIODS = [34, 52, 74];

/** Tech stack as a little solar system: Kotlin at the core, one ring per area. */
export const stack: SvgWidget = {
  kind: "svg",
  name: "stack",
  alt: "tech stack orbit",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const rings = ctx.config.stack;
    const k = icon("kotlin");
    const css = rings
      .map((_, i) => {
        const dir = i % 2 === 0 ? "spin" : "spinR";
        const back = i % 2 === 0 ? "spinR" : "spin";
        return `.r${i}{transform-origin:${CX}px ${CY}px;animation:${dir} ${PERIODS[i]}s linear infinite}.c${i}{transform-box:fill-box;transform-origin:center;animation:${back} ${PERIODS[i]}s linear infinite}`;
      })
      .join("") + `
.core{transform-box:fill-box;transform-origin:center;animation:corePulse 3s ease-in-out infinite}
@keyframes corePulse{0%,100%{opacity:.25;transform:scale(.85)}50%{opacity:.55;transform:scale(1.15)}}
.halo{transform-box:fill-box;transform-origin:center;animation:haloOut 3s ease-out infinite}
@keyframes haloOut{from{opacity:.6;transform:scale(.6)}to{opacity:0;transform:scale(1.6)}}`;

    const orbits = rings
      .map((ring, i) => {
        const r = RADII[i];
        const n = ring.items.length;
        const offset = i * 37;
        const chips = ring.items
          .map((it, j) => {
            const a = ((offset + (j * 360) / n) * Math.PI) / 180;
            const x = CX + r * Math.sin(a);
            const y = CY - r * Math.cos(a);
            const brand = icon(it.icon).color;
            const fill = brand;
            return `<g class="c${i} loop"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="19" fill="${t.raised}" stroke="${t.border}"/>${iconSvg(it.icon, x - 10, y - 10, 20, fill)}</g>`;
          })
          .join("");
        const comet = `<circle cx="${CX}" cy="${CY - r}" r="2.6" fill="${t.glow}" filter="url(#glow)"/>`;
        return `<circle cx="${CX}" cy="${CY}" r="${r}" stroke="${t.subtle}" stroke-dasharray="${i === 1 ? "1 6" : "4 6"}" class="fade" style="animation-delay:${(0.2 + i * 0.15).toFixed(2)}s"/>
<g class="r${i} loop">${comet}${chips}</g>`;
      })
      .join("\n");

    const legend = rings
      .map((ring, i) => {
        const y = 92 + i * 92;
        const names = ring.items.map((it) => it.name).join(" · ");
        return `<g class="in" style="animation-delay:${(0.4 + i * 0.15).toFixed(2)}s">
<text x="24" y="${y}" font-size="11" letter-spacing="2" class="a b">${esc(`0${i + 1} — ${ring.label}`)}</text>
<text x="24" y="${y + 24}" font-size="15" class="t b">${esc(names)}</text>
<rect x="24" y="${y + 38}" width="${36 + i * 30}" height="3" rx="1.5" fill="url(#accentGrad)"/>
<text x="${24}" y="${y + 58}" font-size="10.5" class="m">ring ${i + 1} · r=${RADII[i]} · orbit ${PERIODS[i]}s</text>
</g>`;
      })
      .join("");

    const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
${label(t, 24, 30, "tech stack · orbit")}
${legend}
${orbits}
<circle class="halo loop" cx="${CX}" cy="${CY}" r="34" stroke="${t.accent}" stroke-width="1.5"/>
<circle class="core loop" cx="${CX}" cy="${CY}" r="38" fill="${t.accent}" filter="url(#softglow)"/>
<circle cx="${CX}" cy="${CY}" r="30" fill="${t.raised}" stroke="${t.border}"/>
<svg x="${CX - 15}" y="${CY - 15}" width="30" height="30" viewBox="${k.viewBox}">${k.inner.replace(/currentColor/g, k.color)}</svg>`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, body });
  },
};
