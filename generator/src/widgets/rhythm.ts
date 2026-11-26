import { esc, num } from "../lib/escape.js";
import { label, polar, svg } from "../lib/svg.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 410;
const H = 300;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function chronotype(hours: number[]): string {
  const total = hours.reduce((a, b) => a + b, 0) || 1;
  const sum = (a: number, b: number) => hours.slice(a, b).reduce((x, y) => x + y, 0) / total;
  const night = sum(21, 24) + sum(0, 5);
  const morning = sum(5, 11);
  if (night > 0.3) return "night owl";
  if (morning > 0.35) return "early bird";
  return "day shift";
}

/** 24h radial clock of commit hours + weekday bars. */
export const rhythm: SvgWidget = {
  kind: "svg",
  name: "rhythm",
  alt: "coding rhythm by hour and weekday",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const hours = ctx.data.commitHours;
    const cx = 122;
    const cy = 162;
    const r0 = 38;
    const r1 = 84;
    let clock = "";
    let center = "";
    if (hours) {
      const max = Math.max(1, ...hours);
      const peak = hours.indexOf(max);
      clock = hours
        .map((v, h) => {
          const len = Math.max(2, (v / max) * (r1 - r0));
          const a = h * 15;
          const [x1, y1] = polar(cx, cy, r0, a);
          const [x2, y2] = polar(cx, cy, r0 + len, a);
          const color = h === peak ? t.glow : v / max > 0.6 ? t.accent : t.subtle;
          return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)}" stroke-dashoffset="${len.toFixed(1)}" style="animation:draw .8s cubic-bezier(.2,.7,.2,1) ${(0.3 + h * 0.04).toFixed(2)}s forwards"/>`;
        })
        .join("");
      const ticks = [0, 6, 12, 18]
        .map((h) => {
          const [x, y] = polar(cx, cy, r1 + 14, h * 15);
          return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" font-size="10" text-anchor="middle" class="m">${String(h).padStart(2, "0")}</text>`;
        })
        .join("");
      const [hx, hy] = polar(cx, cy, r0 - 6, peak * 15);
      clock += ticks + `<g style="transform-origin:${cx}px ${cy}px;animation:spin 60s linear infinite" class="loop"><circle cx="${cx}" cy="${cy - r1 - 4}" r="2.5" fill="${t.glow}" filter="url(#glow)"/></g>
<line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="${t.glow}" stroke-width="2" stroke-linecap="round" class="fade" style="animation-delay:1.4s"/>`;
      center = `<circle cx="${cx}" cy="${cy}" r="4" fill="${t.glow}"/>
<text x="24" y="${H - 18}" font-size="11" class="t b">${esc(chronotype(hours))} · peak ${String(peak).padStart(2, "0")}:00</text>`;
    } else {
      clock = `<circle cx="${cx}" cy="${cy}" r="${(r0 + r1) / 2}" stroke="${t.subtle}" stroke-dasharray="2 6"/>`;
      center = `<text x="${cx}" y="${cy + 4}" font-size="11" text-anchor="middle" class="m">hourly data pending</text>`;
    }
    const wd = ctx.d.weekdays;
    const wMax = Math.max(1, ...wd);
    const best = wd.indexOf(wMax);
    const bars = wd
      .map((v, i) => {
        const y = 74 + i * 26;
        const w = Math.max(3, (v / wMax) * 96);
        return `<g class="in" style="animation-delay:${(0.4 + i * 0.08).toFixed(2)}s"><text x="252" y="${y + 9}" font-size="11" class="${i === best ? "a b" : "m"}">${DAYS[i]}</text>
<rect x="286" y="${y}" width="${w.toFixed(1)}" height="10" rx="3" fill="${i === best ? t.accent : t.subtle}" style="transform-box:fill-box;transform-origin:left;animation:growX .8s cubic-bezier(.2,.7,.2,1) ${(0.6 + i * 0.08).toFixed(2)}s both"/></g>`;
      })
      .join("");
    const avg = ctx.d.average;
    const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
${label(t, 24, 30, "coding rhythm")}
<circle cx="${cx}" cy="${cy}" r="${r0 - 10}" fill="${t.raised}" stroke="${t.border}"/>
${clock}
${center}
${bars}
<text x="252" y="${H - 18}" font-size="10" class="m">${esc(`⌀ ${num(avg, 1)}/day · best: ${DAYS[best]}`)}</text>`;
    return svg({ width: W, height: H, theme: t, title: this.alt, body });
  },
};
