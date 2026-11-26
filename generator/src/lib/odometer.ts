import { esc } from "./escape.js";
import { EASE } from "./svg.js";

export interface OdometerOptions {
  x: number;
  /** text baseline */
  y: number;
  fontSize: number;
  className?: string;
  anchor?: "start" | "middle" | "end";
  /** seconds */
  delay?: number;
  duration?: number;
  /** full extra spins before landing, per column */
  spins?: number;
}

let uid = 0;
let lastWidth = 0;

/** Rendered width of the most recent odometer (for placing units after it). */
export function odometerWidth(): number {
  return lastWidth;
}

/**
 * Rolling-digit counter. Each digit is a vertical strip of 0-9 (repeated)
 * inside a clip window that slides into place via a CSS `roll` keyframe.
 * Non-digit characters (separators, units) are rendered statically.
 */
export function odometer(value: string, o: OdometerOptions): string {
  const { fontSize, className = "t b", anchor = "start", delay = 0, duration = 1.8, spins = 1 } = o;
  const adv = fontSize * 0.6;
  const lineH = fontSize * 1.25;
  const chars = [...value];
  // thin spaces (digit grouping) take half an advance so groups read as one number
  const advOf = (c: string) => (c === "\u2009" ? adv * 0.45 : adv);
  const offsets: number[] = [];
  let width = 0;
  for (const c of chars) {
    offsets.push(width);
    width += advOf(c);
  }
  const x0 = anchor === "start" ? o.x : anchor === "middle" ? o.x - width / 2 : o.x - width;
  const id = `odo${uid++}`;
  const top = o.y - fontSize * 0.95;
  const cols: string[] = [];
  let di = 0;
  chars.forEach((c, i) => {
    const cx = x0 + offsets[i];
    if (c === "\u2009") return;
    if (!/\d/.test(c)) {
      cols.push(`<text x="${cx.toFixed(1)}" y="${o.y}" font-size="${fontSize}" class="${className}">${esc(c)}</text>`);
      return;
    }
    const d = Number(c);
    const loops = spins + (di % 2); // alternate spin counts so columns settle unevenly
    const strip: string[] = [];
    const total = (loops + 1) * 10;
    for (let k = 0; k < total; k++) {
      strip.push(`<text x="${cx.toFixed(1)}" y="${(o.y + k * lineH).toFixed(1)}" font-size="${fontSize}" class="${className}">${k % 10}</text>`);
    }
    const shift = -(loops * 10 + d) * lineH;
    const colDelay = delay + di * 0.08;
    cols.push(
      `<g style="--y:${shift.toFixed(1)}px;animation:roll ${duration}s ${EASE} ${colDelay.toFixed(2)}s both">${strip.join("")}</g>`,
    );
    di++;
  });
  lastWidth = width;
  return `<clipPath id="${id}"><rect x="${x0 - 2}" y="${top.toFixed(1)}" width="${width + 4}" height="${lineH.toFixed(1)}"/></clipPath><g clip-path="url(#${id})">${cols.join("")}</g>`;
}
