import type { Theme } from "../theme.js";
import { esc } from "./escape.js";
import { FONT_STACK, fontFaceCss, type Weight } from "./font.js";

export interface SvgOptions {
  width: number;
  height: number;
  theme: Theme;
  /** accessible title (aria-label); never rendered */
  title: string;
  body: string;
  css?: string;
  defs?: string;
  /** which font weights to embed; false to embed none */
  fonts?: Weight[] | false;
}

/** Easing used for most entrance motion. */
export const EASE = "cubic-bezier(.2,.7,.2,1)";

/** Shared CSS available to every widget. */
export function baseCss(t: Theme): string {
  return `
svg{color-scheme:${t.name}}
text{font-family:${FONT_STACK};}
.t{fill:${t.text}}.m{fill:${t.muted}}.a{fill:${t.accent}}.g{fill:${t.glow}}.s{fill:${t.subtle}}
.b{font-weight:700}
.fx{transform-box:fill-box;transform-origin:center}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pop{0%{opacity:0;transform:scale(.2)}70%{opacity:1;transform:scale(1.15)}100%{opacity:1;transform:scale(1)}}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes pulse{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes spinR{to{transform:rotate(-360deg)}}
@keyframes roll{to{transform:translateY(var(--y))}}
@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes growX{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes shimmer{0%{transform:translateX(-120%)}60%,100%{transform:translateX(220%)}}
.in{animation:fadeUp .8s ${EASE} both}
.fade{animation:fadeIn .8s ease both}
.blink{animation:blink 1s step-end infinite}
@media (prefers-reduced-motion: reduce){
  *{animation-delay:0s!important;animation-duration:1ms!important;animation-iteration-count:1!important}
  .loop{animation:none!important}
}`;
}

/** Wrap a widget body into a standalone SVG document. */
export function svg(o: SvgOptions): string {
  const fonts = o.fonts === false ? "" : fontFaceCss(o.fonts ?? [400, 700]);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}" fill="none" role="img" aria-label="${esc(o.title)}">
<title>${esc(o.title)}</title>
<style>${fonts}${baseCss(o.theme)}${o.css ?? ""}</style>
<defs>${commonDefs(o.theme)}${o.defs ?? ""}</defs>
${o.body}
</svg>
`;
}

/** Defs that many widgets use: glow filter, dot-grid pattern, accent gradient, shine. */
export function commonDefs(t: Theme): string {
  return `
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="softglow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="8"/></filter>
<pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${t.subtle}" opacity="${t.name === "dark" ? 0.55 : 0.8}"/></pattern>
<linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.glow}"/></linearGradient>
<linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity="${t.name === "dark" ? 0.12 : 0.5}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="cardFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.card}" stop-opacity="0"/><stop offset="1" stop-color="${t.card}"/></linearGradient>`;
}

export interface CardOptions {
  x?: number;
  y?: number;
  width: number;
  height: number;
  radius?: number;
  dots?: boolean;
}

/** A rounded card surface with a hairline border and optional dot-grid texture. */
export function card(t: Theme, o: CardOptions): string {
  const { x = 0.5, y = 0.5, width, height, radius = 12, dots = true } = o;
  return `<rect x="${x}" y="${y}" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="${t.card}" stroke="${t.border}"/>${
    dots ? `<rect x="${x}" y="${y}" width="${width - 1}" height="${height - 1}" rx="${radius}" fill="url(#dots)" opacity=".5"/>` : ""
  }`;
}

/** Section label like `// CONTRIBUTIONS` with a pulsing accent dot. */
export function label(t: Theme, x: number, y: number, text: string, delay = 0): string {
  return `<g class="in" style="animation-delay:${delay}s">
<circle cx="${x + 4}" cy="${y - 4}" r="4" fill="${t.accent}"/><circle cx="${x + 4}" cy="${y - 4}" r="4" fill="${t.accent}" class="loop" style="animation:pulse 2s ease-in-out infinite" filter="url(#glow)"/>
<text x="${x + 16}" y="${y}" font-size="12" letter-spacing="2" class="m b">${esc(text.toUpperCase())}</text></g>`;
}

/** Approximate rendered width of monospace text (JetBrains Mono advance = 0.6em). */
export function textWidth(text: string, fontSize: number): number {
  return [...text].length * fontSize * 0.6;
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
