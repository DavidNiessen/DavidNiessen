import { svg } from "../lib/svg.js";
import type { SvgWidget } from "./types.js";

const W = 840;
const H = 24;
const STEPS = 24;

/** Hairline with a red square that steps along it like a progress marker. */
export const divider: SvgWidget = {
  kind: "svg",
  name: "divider",
  alt: "divider",
  render(ctx) {
    const t = ctx.theme;
    const css = `.mk{animation:mk 6s steps(${STEPS}) infinite}@keyframes mk{to{transform:translateX(${W - 8}px)}}`;
    const ticks = Array.from({ length: STEPS + 1 }, (_, i) => `<rect x="${((i * (W - 8)) / STEPS + 3.5).toFixed(1)}" y="${H / 2 - 3}" width="1" height="6" fill="${t.faint}"/>`).join("");
    const body = `<rect class="rule" x="0" y="${H / 2 - 0.5}" width="${W}" height="1" fill="${t.muted}"/>${ticks}
<rect class="mk loop" x="0" y="${H / 2 - 4}" width="8" height="8" fill="${t.red}"/>`;
    return svg({ width: W, height: H, theme: t, title: "divider", css, body, fonts: false });
  },
};
