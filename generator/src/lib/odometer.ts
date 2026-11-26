import { esc } from "./escape.js";
import { displayMetrics } from "./metrics.js";
import { EASE } from "./svg.js";

export interface OdometerOptions {
  x: number;
  /** text baseline */
  y: number;
  fontSize: number;
  /** CSS classes for the digits (default: display face, ink) */
  className?: string;
  anchor?: "start" | "middle" | "end";
  /** seconds */
  delay?: number;
  duration?: number;
  /** full extra spins before landing */
  spins?: number;
}

let uid = 0;
let lastWidth = 0;

/** Rendered width of the most recent odometer (for placing units after it). */
export function odometerWidth(): number {
  return lastWidth;
}

/** Advance widths for the display face at `size` (digits share the widest digit's slot). */
function advances(size: number): { digit: number; of: (c: string) => number } {
  const m = displayMetrics();
  const k = size / m.unitsPerEm;
  const digit = Math.max(...[..."0123456789"].map((c) => m.advance(c.codePointAt(0)!))) * k;
  return {
    digit,
    of: (c: string) => (/\d/.test(c) ? digit : c === " " ? digit * 0.3 : m.advance(c.codePointAt(0)!) * k),
  };
}

/**
 * Rolling-digit counter in the display face. Each digit is a vertical
 * strip of 0–9 inside a clip window that rolls into place (CSS `roll`).
 */
export function odometer(value: string, o: OdometerOptions): string {
  const { fontSize, className = "d ink", anchor = "start", delay = 0, duration = 1.6, spins = 1 } = o;
  const a = advances(fontSize);
  const lineH = fontSize * 1.05;
  const chars = [...value];
  const offsets: number[] = [];
  let width = 0;
  for (const c of chars) {
    offsets.push(width);
    width += a.of(c);
  }
  const x0 = anchor === "start" ? o.x : anchor === "middle" ? o.x - width / 2 : o.x - width;
  const id = `odo${uid++}`;
  const top = o.y - fontSize * 0.86;
  const cols: string[] = [];
  let di = 0;
  chars.forEach((c, i) => {
    const cx = x0 + offsets[i] + (/\d/.test(c) ? a.digit / 2 : 0);
    if (c === " ") return;
    if (!/\d/.test(c)) {
      cols.push(`<text x="${(x0 + offsets[i]).toFixed(1)}" y="${o.y}" font-size="${fontSize}" class="${className}">${esc(c)}</text>`);
      return;
    }
    const d = Number(c);
    const loops = spins + (di % 2);
    const strip: string[] = [];
    for (let k = 0; k < (loops + 1) * 10; k++) {
      strip.push(`<text x="${cx.toFixed(1)}" y="${(o.y + k * lineH).toFixed(1)}" font-size="${fontSize}" text-anchor="middle" class="${className}">${k % 10}</text>`);
    }
    const shift = -(loops * 10 + d) * lineH;
    cols.push(`<g style="--y:${shift.toFixed(1)}px;animation:roll ${duration}s ${EASE} ${(delay + di * 0.07).toFixed(2)}s both">${strip.join("")}</g>`);
    di++;
  });
  lastWidth = width;
  return `<clipPath id="${id}"><rect x="${x0 - 2}" y="${top.toFixed(1)}" width="${width + 4}" height="${(fontSize * 1.02).toFixed(1)}"/></clipPath><g clip-path="url(#${id})">${cols.join("")}</g>`;
}
