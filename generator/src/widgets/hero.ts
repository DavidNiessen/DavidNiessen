import { age, formatLongDate, greeting, moonPhase, pad2, parseBirthday } from "../lib/astro.js";
import { esc } from "../lib/escape.js";
import { displayWidth } from "../lib/metrics.js";
import { caption, hrule, marquee, PAD, reveal } from "../lib/swiss.js";
import { EASE, svg } from "../lib/svg.js";
import { moonGlyph } from "./parts.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 840;
const H = 330;

export const hero: SvgWidget = {
  kind: "svg",
  name: "hero",
  alt: "David Nießen — Software Engineer",
  render(ctx) {
    const t = ctx.theme;
    const moon = moonPhase(ctx.date);
    const b = parseBirthday(ctx.config.birthday);
    const [first, ...rest] = ctx.config.name.split(" ");
    const last = rest.join(" ");
    const size = 124;
    const lastW = displayWidth(last, size, -1);
    const facts: [string, string][] = [
      ["role", "Software Engineer"],
      ["at", ctx.config.company],
      ["based", `${ctx.config.location.city}, DE`],
      ["age", String(age(b, ctx.now))],
      ["runs on", "Kotlin · JVM · K8s"],
    ];
    const fx = 548;
    const rowH = 38;
    const fy = 74;
    const factRows = facts
      .map(([k, v], i) => {
        const y = fy + i * rowH;
        const d = 0.7 + i * 0.09;
        return `${hrule(t, fx, y, W - PAD - fx, d - 0.2)}
<g class="rise" style="animation-delay:${d.toFixed(2)}s">${caption(t, k, fx, y + 24)}<text x="${fx + 78}" y="${y + 26}" font-size="21" class="d ink" letter-spacing=".3">${esc(v)}</text></g>`;
      })
      .join("");
    const meta = `${greeting(ctx.now.hour)} · ${formatLongDate(ctx.now)} · ${pad2(ctx.now.hour)}:${pad2(ctx.now.minute)} CET`;
    const css = `.sq{transform-box:fill-box;transform-origin:left bottom;animation:pop .5s ${EASE} 1.2s both}`;
    const band = 280;
    const body = `<rect width="${W}" height="${H}" fill="${t.paper}"/>
<rect class="rule" x="0" y="0" width="${W}" height="8" fill="${t.ink}"/>
<g class="rise" style="animation-delay:.1s">
<text x="${PAD}" y="36" font-size="20" class="d red">01</text>
${caption(t, "Profile — README", PAD + 30, 34, { cls: "ink" })}
${moonGlyph(t, W - PAD - 6, 30, 6, moon.phase)}
${caption(t, meta, W - PAD - 20, 34, { anchor: "end" })}
</g>
${hrule(t, PAD, 48, W - PAD * 2, 0.2)}
${reveal(t, first, PAD - 4, 152, size, { delay: 0.25, ls: -1 })}
${reveal(t, last, PAD - 4, 260, size, { delay: 0.4, ls: -1 })}
<rect class="sq" x="${(PAD + lastW + 6).toFixed(1)}" y="${260 - 24}" width="24" height="24" fill="${t.red}"/>
${factRows}
${hrule(t, fx, fy + facts.length * rowH, W - PAD - fx, 1.1)}
${marquee(t, [...ctx.config.roles, ...ctx.config.skills.slice(0, 6)], 0, band, W, H - band, { size: 22, speed: 46, inverse: true })}`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, body });
  },
};
