/**
 * Swiss-editorial building blocks: section frames, masked text reveals,
 * marquee tickers and stat cells. Flat fills only.
 */
import type { Theme } from "../theme.js";
import { esc } from "./escape.js";
import { displayWidth } from "./metrics.js";
import { EASE, OUT } from "./svg.js";

export const PAD = 24;
export const HEAD = 56;

let uid = 0;
export function nextId(prefix: string): string {
  return `${prefix}${uid++}`;
}

export interface FrameOptions {
  width: number;
  height: number;
  /** section number, e.g. "04" */
  no: string;
  title: string;
  /** right-aligned mono meta text */
  meta?: string;
}

/**
 * A section sheet: paper ground, heavy ink rule on top that wipes in,
 * red section number, condensed title and a mono meta line, hairline below.
 */
export function frame(t: Theme, o: FrameOptions): string {
  const { width: w, height: h } = o;
  const noW = displayWidth(o.no, 26) + 10;
  return `<rect width="${w}" height="${h}" fill="${t.paper}"/>
<rect class="rule" x="0" y="0" width="${w}" height="5" fill="${t.ink}"/>
<g class="rise" style="animation-delay:.15s">
<text x="${PAD}" y="40" font-size="26" class="d red">${esc(o.no)}</text>
<text x="${PAD + noW}" y="40" font-size="26" class="d ink" letter-spacing=".5">${esc(o.title.toUpperCase())}</text>
${o.meta ? `<text x="${w - PAD}" y="38" font-size="10.5" text-anchor="end" letter-spacing="1" class="mut">${esc(o.meta.toUpperCase())}</text>` : ""}
</g>
<rect class="rule" style="animation-delay:.25s" x="${PAD}" y="${HEAD - 0.5}" width="${w - PAD * 2}" height="1" fill="${t.faint}"/>`;
}

/**
 * Display text that slides up from behind a baseline mask (kinetic type).
 * Returns the markup; the mask is the text's own line box.
 */
export function reveal(t: Theme, text: string, x: number, y: number, size: number, opts: { delay?: number; cls?: string; ls?: number; anchor?: "start" | "end" | "middle"; dur?: number } = {}): string {
  const id = nextId("rv");
  const ls = opts.ls ?? 0;
  const w = displayWidth(text, size, ls);
  const x0 = opts.anchor === "end" ? x - w : opts.anchor === "middle" ? x - w / 2 : x;
  const top = y - size * 0.86;
  const hgt = size * 1.02;
  return `<clipPath id="${id}"><rect x="${x0 - 4}" y="${top.toFixed(1)}" width="${(w + 8).toFixed(1)}" height="${hgt.toFixed(1)}"/></clipPath>
<g clip-path="url(#${id})"><g style="animation:up ${(opts.dur ?? 0.9).toFixed(2)}s ${EASE} ${(opts.delay ?? 0).toFixed(2)}s both"><text x="${x0.toFixed(1)}" y="${y}" font-size="${size}" class="d ${opts.cls ?? "ink"}" letter-spacing="${ls}">${esc(text)}</text></g></g>`;
}

/** Horizontal infinite ticker of `items` separated by a red square. */
export function marquee(t: Theme, items: string[], x: number, y: number, w: number, h: number, opts: { size?: number; speed?: number; inverse?: boolean } = {}): string {
  const id = nextId("mq");
  const size = opts.size ?? 18;
  const gap = 34;
  const parts: string[] = [];
  let cx = 0;
  const one: string[] = [];
  for (const it of items) {
    one.push(`<text x="${cx.toFixed(1)}" y="0" font-size="${size}" class="d" fill="${opts.inverse ? t.paper : t.ink}" letter-spacing="1">${esc(it.toUpperCase())}</text>`);
    cx += displayWidth(it.toUpperCase(), size, 1) + gap / 2;
    one.push(`<rect x="${(cx - 4).toFixed(1)}" y="${-size * 0.62}" width="${size * 0.42}" height="${size * 0.42}" fill="${t.red}"/>`);
    cx += gap / 2 + size * 0.42;
  }
  const cycle = cx;
  const copies = Math.ceil(w / cycle) + 1;
  for (let i = 0; i < copies; i++) parts.push(`<g transform="translate(${(i * cycle).toFixed(1)} 0)">${one.join("")}</g>`);
  const dur = cycle / (opts.speed ?? 40);
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${opts.inverse ? t.ink : "none"}"/>
<g clip-path="url(#${id})"><g transform="translate(${x} ${(y + h / 2 + size * 0.36).toFixed(1)})"><g class="loop" style="--x:${(-cycle).toFixed(1)}px;animation:marquee ${dur.toFixed(2)}s linear infinite">${parts.join("")}</g></g></g>`;
}

/** Mono label in small caps-ish tracking. */
export function caption(t: Theme, text: string, x: number, y: number, opts: { anchor?: "start" | "end" | "middle"; cls?: string; size?: number } = {}): string {
  return `<text x="${x}" y="${y}" font-size="${opts.size ?? 10}" letter-spacing="1" text-anchor="${opts.anchor ?? "start"}" class="${opts.cls ?? "mut"}">${esc(text.toUpperCase())}</text>`;
}

/** Vertical hairline that grows downwards. */
export function vrule(t: Theme, x: number, y: number, h: number, delay = 0.3): string {
  return `<rect x="${x}" y="${y}" width="1" height="${h}" fill="${t.faint}" style="transform-box:fill-box;transform-origin:top;animation:wipeY .8s ${OUT} ${delay}s both"/>`;
}

export function hrule(t: Theme, x: number, y: number, w: number, delay = 0.3, color?: string, hgt = 1): string {
  return `<rect class="rule" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${w}" height="${hgt}" fill="${color ?? t.faint}"/>`;
}
