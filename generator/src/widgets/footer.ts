import { pad2 } from "../lib/astro.js";
import { esc } from "../lib/escape.js";
import { hash01 } from "./parts.js";
import { svg } from "../lib/svg.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 840;
const H = 130;

function wave(amp: number, len: number, y: number, width: number): string {
  let d = `M0 ${y}`;
  for (let x = 0; x <= width; x += len) {
    d += ` Q${x + len / 4} ${y - amp} ${x + len / 2} ${y} T${x + len} ${y}`;
  }
  return `${d} V${H} H0 Z`;
}

/** Animated waves, a date barcode and the build stamp. */
export const footer: SvgWidget = {
  kind: "svg",
  name: "footer",
  alt: "footer",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const n = ctx.now;
    const stamp = `${n.year}-${pad2(n.month)}-${pad2(n.day)}`;
    const bars: string[] = [];
    let x = 24;
    for (let i = 0; x < 214; i++) {
      const w = 1 + Math.floor(hash01(stamp, i) * 3);
      if (i % 2 === 0) bars.push(`<rect x="${x}" y="22" width="${w}" height="34" fill="${t.text}"/>`);
      x += w + 1;
    }
    const css = `.w1{animation:wv 7s linear infinite}.w2{animation:wv 11s linear infinite reverse}.w3{animation:wv 15s linear infinite}
@keyframes wv{to{transform:translateX(-120px)}}`;
    const defs = `<clipPath id="fc"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12"/></clipPath>`;
    const run = ctx.run ? ` · run #${ctx.run}` : "";
    const body = `<g clip-path="url(#fc)">
<rect width="${W}" height="${H}" fill="${t.card}"/>
<path class="w3 loop" d="${wave(6, 120, 96, W + 240)}" fill="${t.accent}" opacity=".12"/>
<path class="w2 loop" d="${wave(8, 120, 104, W + 240)}" fill="${t.accent}" opacity=".18"/>
<path class="w1 loop" d="${wave(5, 120, 112, W + 240)}" fill="${t.accent}" opacity=".35"/>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" stroke="${t.border}"/>
<g class="fade">${bars.join("")}</g>
<text x="24" y="70" font-size="9.5" letter-spacing="2" class="m">${stamp.replace(/-/g, " ")}</text>
<g class="in" style="animation-delay:.3s">
<text x="${W - 24}" y="34" font-size="13" text-anchor="end" class="t b">rebuilt every night while Berlin sleeps</text>
<text x="${W - 24}" y="54" font-size="11" text-anchor="end" class="m">${esc(`last build ${stamp} ${pad2(n.hour)}:${pad2(n.minute)} CET${run} · ${ctx.data.source} data`)}</text>
</g>`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, defs, body });
  },
};
