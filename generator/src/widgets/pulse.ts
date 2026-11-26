import { lastDays } from "../data/derive.js";
import { esc, num } from "../lib/escape.js";
import { label, svg } from "../lib/svg.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 840;
const H = 190;
const DAYS = 90;

/** Build an ECG trace: one heartbeat per day, QRS amplitude ∝ contributions. */
export function ecgPoints(counts: number[], x0: number, x1: number, base: number, amp: number): [number, number][] {
  const max = Math.max(1, ...counts);
  const step = (x1 - x0) / counts.length;
  const pts: [number, number][] = [[x0, base]];
  counts.forEach((c, i) => {
    const x = x0 + i * step;
    const k = c / max;
    if (c === 0) {
      pts.push([x + step, base]);
      return;
    }
    const h = 6 + k * amp;
    pts.push(
      [x + step * 0.18, base],
      [x + step * 0.26, base - h * 0.12], // P wave
      [x + step * 0.34, base],
      [x + step * 0.42, base + h * 0.14], // Q
      [x + step * 0.5, base - h], // R
      [x + step * 0.58, base + h * 0.3], // S
      [x + step * 0.66, base],
      [x + step * 0.8, base - h * 0.18], // T wave
      [x + step * 0.92, base],
      [x + step, base],
    );
  });
  return pts;
}

export function polyLength(pts: [number, number][]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

export const pulse: SvgWidget = {
  kind: "svg",
  name: "pulse",
  alt: "90-day contribution heartbeat",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const days = lastDays(ctx.d.days, DAYS);
    const counts = days.map((d) => d.count);
    const x0 = 24;
    const x1 = 640;
    const base = 132;
    const pts = ecgPoints(counts, x0, x1, base, 78);
    const d = `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}`;
    const len = polyLength(pts);
    const avg = counts.reduce((a, b) => a + b, 0) / Math.max(1, counts.length);
    const bpm = num(avg * 7, 1);
    const seg = len * 0.18;
    const cycle = 7;
    const css = `
.trace{stroke-dasharray:${len.toFixed(0)};stroke-dashoffset:${len.toFixed(0)};animation:draw 3.2s linear .3s forwards}
.head{stroke-dasharray:${seg.toFixed(0)} ${(len - seg + 40).toFixed(0)};stroke-dashoffset:${seg.toFixed(0)};animation:headRun ${cycle}s linear 3.5s infinite;opacity:0}
@keyframes headRun{0%{stroke-dashoffset:${seg.toFixed(0)};opacity:1}100%{stroke-dashoffset:${(-len).toFixed(0)};opacity:1}}
.heart{transform-box:fill-box;transform-origin:center;animation:beat 1.1s ease-in-out infinite}
@keyframes beat{0%,100%{transform:scale(1)}15%{transform:scale(1.25)}30%{transform:scale(.95)}45%{transform:scale(1.12)}}`;
    const defs = `<pattern id="ecg" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" stroke="${t.accent}" stroke-opacity="${t.name === "dark" ? 0.09 : 0.08}"/></pattern>
<pattern id="ecg5" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" stroke="${t.accent}" stroke-opacity="${t.name === "dark" ? 0.18 : 0.14}"/></pattern>
<linearGradient id="headG" x1="0" x2="1"><stop offset="0" stop-color="${t.glow}" stop-opacity="0"/><stop offset="1" stop-color="${t.glow}"/></linearGradient>
<clipPath id="paper"><rect x="16" y="44" width="${x1 - 8}" height="${H - 56}" rx="8"/></clipPath>`;
    const first = days[0]?.date ?? "";
    const last = days[days.length - 1]?.date ?? "";
    const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
${label(t, 24, 30, `heartbeat · last ${DAYS} days`)}
<g clip-path="url(#paper)"><rect x="16" y="44" width="${x1}" height="${H - 56}" fill="url(#ecg)"/><rect x="16" y="44" width="${x1}" height="${H - 56}" fill="url(#ecg5)"/></g>
<path d="M${x0} ${base}H${x1}" stroke="${t.subtle}" stroke-dasharray="3 4"/>
<path class="trace" d="${d}" stroke="${t.accent}" stroke-width="1.6" stroke-linejoin="round"/>
<path class="head loop" d="${d}" stroke="${t.name === "dark" ? "#fff" : t.glow}" stroke-width="2.2" stroke-linejoin="round" filter="url(#glow)"/>
<circle r="4" fill="${t.name === "dark" ? "#fff" : t.glow}" filter="url(#glow)" opacity="0">
  <animateMotion dur="${cycle}s" begin="3.5s" repeatCount="indefinite" path="${d}" keyPoints="0;1" keyTimes="0;1" calcMode="linear"/>
  <set attributeName="opacity" to="1" begin="3.5s"/>
</circle>
<text x="${x0}" y="${H - 14}" font-size="10" class="m">${esc(first)}</text>
<text x="${x1}" y="${H - 14}" font-size="10" text-anchor="end" class="m">${esc(last)}</text>

<g class="in" style="animation-delay:.6s">
<rect x="${x1 + 24}" y="44" width="${W - x1 - 48}" height="${H - 64}" rx="10" fill="${t.raised}" stroke="${t.border}"/>
<g class="heart loop"><path transform="translate(${x1 + 44} 62) scale(1.1)" d="M8 14s-6-3.6-6-8a3.2 3.2 0 0 1 6-1.6A3.2 3.2 0 0 1 14 6c0 4.4-6 8-6 8Z" fill="${t.accent}" filter="url(#glow)"/></g>
<text x="${x1 + 70}" y="76" font-size="10.5" letter-spacing="1" class="m">BPM*</text>
<text x="${x1 + 44}" y="122" font-size="40" class="t b">${bpm}</text>
<text x="${x1 + 44}" y="144" font-size="10" class="m">*commits per week,</text>
<text x="${x1 + 44}" y="157" font-size="10" class="m">roughly</text>
</g>`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, defs, body });
  },
};
