import type { Theme } from "../theme.js";
import { esc } from "./escape.js";
import { DISPLAY_STACK, FONT_STACK, fontFaceCss, type Weight } from "./font.js";

export interface SvgOptions {
  width: number;
  height: number;
  theme: Theme;
  /** accessible title (aria-label); never rendered */
  title: string;
  body: string;
  css?: string;
  defs?: string;
  /** which font faces to embed; false to embed none */
  fonts?: Weight[] | false;
}

/** Editorial easing: quick start, long settle. */
export const EASE = "cubic-bezier(.7,0,.2,1)";
export const OUT = "cubic-bezier(.2,.7,.2,1)";

/** Shared CSS available to every widget. */
export function baseCss(t: Theme): string {
  return `
text{font-family:${FONT_STACK};}
.d{font-family:${DISPLAY_STACK};font-weight:800}
.ink{fill:${t.ink}}.mut{fill:${t.muted}}.red{fill:${t.red}}.pap{fill:${t.paper}}
.b{font-weight:700}
.fx{transform-box:fill-box;transform-origin:center}
@keyframes up{from{transform:translateY(105%)}to{transform:none}}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes show{from{opacity:0}to{opacity:1}}
@keyframes wipeX{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes wipeY{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes pop{0%{transform:scale(0)}100%{transform:scale(1)}}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes roll{to{transform:translateY(var(--y))}}
@keyframes marquee{to{transform:translateX(var(--x))}}
.rise{animation:rise .7s ${OUT} both}
.show{animation:show .6s linear both}
.rule{transform-box:fill-box;transform-origin:left;animation:wipeX .9s ${EASE} both}
.blink{animation:blink 1s step-end infinite}
@media (prefers-reduced-motion: reduce){
  *{animation-delay:0s!important;animation-duration:1ms!important;animation-iteration-count:1!important}
  .loop{animation:none!important}
}`;
}

/** Wrap a widget body into a standalone SVG document. */
export function svg(o: SvgOptions): string {
  const fonts = o.fonts === false ? "" : fontFaceCss(o.fonts ?? [400, 700, "display"]);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}" fill="none" role="img" aria-label="${esc(o.title)}">
<title>${esc(o.title)}</title>
<style>${fonts}${baseCss(o.theme)}${o.css ?? ""}</style>
${o.defs ? `<defs>${o.defs}</defs>` : ""}
${o.body}
</svg>
`;
}

/** Approximate rendered width of monospace text (JetBrains Mono advance = 0.6em). */
export function textWidth(text: string, fontSize: number, letterSpacing = 0): number {
  return [...text].length * (fontSize * 0.6 + letterSpacing);
}

/** Inline style with an animation delay. */
export function delay(s: number): string {
  return `animation-delay:${s.toFixed(2)}s`;
}

/** Polar → cartesian. Angle in degrees, 0 = 12 o'clock, clockwise. */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/** SVG arc path between two angles (degrees, clockwise from 12 o'clock). */
export function arcPath(cx: number, cy: number, r: number, from: number, to: number): string {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}
