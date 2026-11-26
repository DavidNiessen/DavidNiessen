import { formatLongDate, greeting, moonPhase } from "../lib/astro.js";
import { esc } from "../lib/escape.js";
import { icon } from "../lib/icons.js";
import { svg, textWidth } from "../lib/svg.js";
import { moonGlyph } from "./parts.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 840;
const H = 280;

/** SMIL typewriter: per-role clip width + cursor x, typed and erased char by char. */
function typewriter(ctx: Ctx, x: number, y: number, size: number): string {
  const t = ctx.theme;
  const roles = ctx.config.roles;
  const slot = 4; // seconds per role
  const total = slot * roles.length;
  const adv = size * 0.6;
  const parts: string[] = [];
  roles.forEach((role, i) => {
    const n = [...role].length;
    const start = i * slot;
    const typeDur = Math.min(1.6, n * 0.06);
    const eraseDur = Math.min(0.7, n * 0.025);
    const holdEnd = start + slot - eraseDur - 0.15;
    // keyframes as [time, chars]
    const frames: [number, number][] = [[0, 0]];
    if (start > 0) frames.push([start, 0]);
    for (let c = 1; c <= n; c++) frames.push([start + (typeDur * c) / n, c]);
    frames.push([holdEnd, n]);
    for (let c = n - 1; c >= 0; c--) frames.push([holdEnd + (eraseDur * (n - c)) / n, c]);
    frames.push([total, 0]);
    const keyTimes = frames.map(([s]) => (s / total).toFixed(4)).join(";");
    const widths = frames.map(([, c]) => (c * adv).toFixed(1)).join(";");
    const id = `tw${i}`;
    parts.push(`<clipPath id="${id}"><rect x="${x}" y="${y - size}" height="${size * 1.4}" width="0"><animate attributeName="width" dur="${total}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${keyTimes}" values="${widths}"/></rect></clipPath>
<text x="${x}" y="${y}" font-size="${size}" class="t" clip-path="url(#${id})">${esc(role)}</text>
<rect y="${y - size * 0.82}" width="${size * 0.55}" height="${size}" fill="${t.accent}" x="${x}" opacity="0">
<animate attributeName="x" dur="${total}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${keyTimes}" values="${frames.map(([, c]) => (x + c * adv + 2).toFixed(1)).join(";")}"/>
<animate attributeName="opacity" dur="${total}s" repeatCount="indefinite" calcMode="discrete" keyTimes="0;${(start / total).toFixed(4)};${((start + slot) / total).toFixed(4)}" values="0;1;0"/>
</rect>`);
  });
  return `<text x="${x - size * 1.3}" y="${y}" font-size="${size}" class="a b">&gt;</text>${parts.join("\n")}`;
}

export const hero: SvgWidget = {
  kind: "svg",
  name: "hero",
  alt: "David Nießen — Software Engineer",
  render(ctx) {
    const t = ctx.theme;
    const moon = moonPhase(ctx.date);
    const name = ctx.config.name;
    const nameSize = 56;
    const nameW = textWidth(name, nameSize);
    const k = icon("kotlin");
    const css = `
.drift{animation:drift 6s linear infinite}
@keyframes drift{to{transform:translate(-16px,-16px)}}
.blob{animation:blob 14s ease-in-out infinite alternate}
@keyframes blob{0%{transform:translate(0,0)}50%{transform:translate(-120px,40px)}100%{transform:translate(60px,-20px)}}
.name{stroke:${t.text};stroke-width:1.2;stroke-dasharray:180;stroke-dashoffset:180;fill:${t.text};fill-opacity:0;
  animation:draw 2.2s cubic-bezier(.6,.1,.3,1) .2s forwards,fillIn .8s ease 1.8s forwards}
@keyframes fillIn{to{fill-opacity:1;stroke-width:0}}
.gl{opacity:0;animation:glitch 7s steps(1) 3s infinite}
.gl2{animation-delay:3.08s}
@keyframes glitch{0%{opacity:0;transform:none}2%{opacity:.9;transform:translate(-5px,0)}3%{transform:translate(4px,0)}4.5%{transform:translate(-2px,0)}6%{opacity:0;transform:none}100%{opacity:0}}
.scan{animation:scan 5s linear infinite}
@keyframes scan{from{transform:translateY(-20px)}to{transform:translateY(${H + 20}px)}}
.bob{animation:bob 5s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.ring{transform-box:fill-box;transform-origin:center;animation:spin 18s linear infinite}
.ring2{transform-box:fill-box;transform-origin:center;animation:spinR 26s linear infinite}
.kpulse{transform-box:fill-box;transform-origin:center;animation:kp 3s ease-in-out infinite}
@keyframes kp{0%,100%{opacity:.25;transform:scale(.9)}50%{opacity:.6;transform:scale(1.1)}}
.under{transform-box:fill-box;transform-origin:left;animation:growX 1.2s cubic-bezier(.2,.7,.2,1) 2s both}`;
    const defs = `
<clipPath id="frame"><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16"/></clipPath>
<clipPath id="sliceA"><rect x="0" y="62" width="${W}" height="12"/><rect x="0" y="92" width="${W}" height="6"/></clipPath>
<clipPath id="sliceB"><rect x="0" y="76" width="${W}" height="10"/></clipPath>
<linearGradient id="kgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.glow}"/><stop offset=".55" stop-color="${t.accent}"/><stop offset="1" stop-color="#7f1d1d"/></linearGradient>
<radialGradient id="blobG"><stop offset="0" stop-color="${t.accent}" stop-opacity="${t.name === "dark" ? 0.35 : 0.18}"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></radialGradient>
<linearGradient id="scanG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.accent}" stop-opacity="0"/><stop offset="1" stop-color="${t.accent}" stop-opacity="${t.name === "dark" ? 0.12 : 0.05}"/></linearGradient>`;
    const kx = 640;
    const ky = 70;
    const ks = 130;
    const footY = 236;
    const greet = `${greeting(ctx.now.hour)} from ${ctx.config.location.city}`;
    const dateStr = formatLongDate(ctx.now);
    const body = `
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="${t.card}"/>
  <g class="drift loop"><rect x="0" y="0" width="${W + 32}" height="${H + 32}" fill="url(#dots)"/></g>
  <g class="blob loop"><circle cx="560" cy="120" r="260" fill="url(#blobG)"/></g>
  <rect class="scan loop" x="0" y="0" width="${W}" height="20" fill="url(#scanG)"/>
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="16" stroke="${t.border}"/>

<g class="in" style="animation-delay:.1s">
  <rect x="48" y="40" width="148" height="24" rx="12" fill="${t.raised}" stroke="${t.border}"/>
  <circle cx="64" cy="52" r="4" fill="#22c55e"/><circle cx="64" cy="52" r="4" fill="#22c55e" class="loop" style="animation:pulse 1.6s ease-in-out infinite" filter="url(#glow)"/>
  <text x="76" y="56.5" font-size="11.5" class="m">hello, world_</text>
</g>

<text x="48" y="122" font-size="${nameSize}" class="name b" letter-spacing="-1">${esc(name)}</text>
<g class="gl loop" clip-path="url(#sliceA)"><text x="48" y="122" font-size="${nameSize}" class="b" fill="${t.accent}" letter-spacing="-1">${esc(name)}</text></g>
<g class="gl gl2 loop" clip-path="url(#sliceB)"><text x="51" y="122" font-size="${nameSize}" class="b" fill="${t.muted}" letter-spacing="-1">${esc(name)}</text></g>
<rect class="under" x="50" y="138" width="${(nameW * 0.32).toFixed(0)}" height="4" rx="2" fill="url(#accentGrad)"/>

${typewriter(ctx, 70, 182, 22)}

<g class="in" style="animation-delay:2.4s">
  ${moonGlyph(t, 58, footY - 4, 9, moon.phase)}
  <text x="76" y="${footY}" font-size="13" class="m">${esc(greet)} · ${esc(dateStr)} · ${esc(moon.name.toLowerCase())}</text>
</g>

<g transform="translate(${kx} ${ky})">
  <circle class="ring loop" cx="${ks / 2}" cy="${ks / 2}" r="${ks * 0.78}" stroke="${t.subtle}" stroke-dasharray="2 10" stroke-width="2"/>
  <circle class="ring2 loop" cx="${ks / 2}" cy="${ks / 2}" r="${ks * 0.62}" stroke="${t.accent}" stroke-opacity=".5" stroke-dasharray="40 160 10 60" stroke-width="1.5"/>
  <g class="bob loop">
    <circle class="kpulse loop" cx="${ks / 2}" cy="${ks / 2}" r="${ks * 0.36}" fill="${t.accent}" filter="url(#softglow)"/>
    <svg x="${ks * 0.2}" y="${ks * 0.2}" width="${ks * 0.6}" height="${ks * 0.6}" viewBox="${k.viewBox}"><path d="${/d="([^"]+)"/.exec(k.inner)?.[1]}" fill="url(#kgrad)"/></svg>
  </g>
</g>`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, defs, body });
  },
};
