import { svg } from "../lib/svg.js";
import type { SvgWidget } from "./types.js";

const W = 840;
const H = 28;

export const divider: SvgWidget = {
  kind: "svg",
  name: "divider",
  alt: "divider",
  render(ctx) {
    const t = ctx.theme;
    const css = `
.comet{animation:comet 5s cubic-bezier(.6,0,.4,1) infinite}
@keyframes comet{0%{transform:translateX(-160px)}100%{transform:translateX(${W + 40}px)}}
.tick{animation:pulse 2.4s ease-in-out infinite}`;
    const defs = `<linearGradient id="cometG" x1="0" x2="1"><stop offset="0" stop-color="${t.accent}" stop-opacity="0"/><stop offset=".85" stop-color="${t.glow}"/><stop offset="1" stop-color="#fff"/></linearGradient>
<linearGradient id="lineG" x1="0" x2="1"><stop offset="0" stop-color="${t.border}" stop-opacity="0"/><stop offset=".5" stop-color="${t.subtle}"/><stop offset="1" stop-color="${t.border}" stop-opacity="0"/></linearGradient>`;
    const ticks = Array.from({ length: 3 }, (_, i) => {
      const x = W / 2 - 16 + i * 16;
      return `<rect class="tick loop" style="animation-delay:${i * 0.3}s" x="${x - 3}" y="${H / 2 - 3}" width="6" height="6" rx="1.5" transform="rotate(45 ${x} ${H / 2})" fill="${i === 1 ? t.accent : t.subtle}"/>`;
    }).join("");
    const body = `<rect x="0" y="${H / 2 - 0.5}" width="${W}" height="1" fill="url(#lineG)"/>
<g class="comet loop"><rect x="0" y="${H / 2 - 1}" width="140" height="2" rx="1" fill="url(#cometG)" filter="url(#glow)"/></g>
<rect x="${W / 2 - 34}" y="${H / 2 - 6}" width="68" height="12" fill="${t.bg}"/>${ticks}`;
    return svg({ width: W, height: H, theme: t, title: "divider", css, defs, body, fonts: false });
  },
};
