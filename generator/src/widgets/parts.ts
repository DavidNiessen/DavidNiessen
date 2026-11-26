import type { Theme } from "../theme.js";

/**
 * Moon disc with the correct terminator for the phase (0 new → .5 full → 1 new).
 * Drawn as a lit half-disc plus an elliptical bulge whose width follows the phase.
 */
export function moonGlyph(t: Theme, cx: number, cy: number, r: number, phase: number): string {
  const lit = t.ink;
  const dark = t.faint;
  const waxing = phase < 0.5;
  const k = Math.cos(2 * Math.PI * phase); // 1 new, -1 full
  const rx = Math.abs(k) * r;
  // outer lit edge: right side when waxing, left when waning (northern hemisphere)
  const sweepOuter = waxing ? 1 : 0;
  // terminator bulges toward the lit side when gibbous (k<0), away when crescent
  const sweepInner = (k < 0) === waxing ? 1 : 0;
  const d = `M${cx} ${cy - r}A${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy + r}A${rx.toFixed(2)} ${r} 0 0 ${sweepInner} ${cx} ${cy - r}Z`;
  return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="${dark}"/><path d="${d}" fill="${lit}"/></g>`;
}

/** Tiny 16×16 line glyphs drawn from scratch (stroke = currentColor). */
export const glyphs = {
  flame: `<path d="M8 1.5c.6 2.6 4 3.8 4 7.6A4 4 0 0 1 4 9.1c0-1.7.8-2.8 1.8-3.6.1 1.6.8 2.5 1.7 2.7C7 6 6.8 3.7 8 1.5Z"/>`,
  bolt: `<path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z"/>`,
  star: `<path d="m8 1.8 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"/>`,
  pr: `<circle cx="4" cy="3.5" r="1.8"/><circle cx="4" cy="12.5" r="1.8"/><circle cx="12" cy="12.5" r="1.8"/><path d="M4 5.3v5.4M12 10.7V6.5a2 2 0 0 0-2-2H7.5m1.5-2-2 2 2 2"/>`,
  calendar: `<rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3"/>`,
  sigma: `<path d="M12 3H4l4.5 5L4 13h8"/>`,
  trophy: `<path d="M5 2h6v4a3 3 0 0 1-6 0zM5 3.5H2.5a2.5 2.5 0 0 0 2.6 3M11 3.5h2.5a2.5 2.5 0 0 1-2.6 3M8 9v3m-2.5 2h5"/>`,
  eye: `<path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z"/><circle cx="8" cy="8" r="2"/>`,
  users: `<circle cx="6" cy="5.5" r="2.5"/><path d="M1.5 14a4.5 4.5 0 0 1 9 0M11 3.2a2.5 2.5 0 0 1 0 4.6M12.5 10a4.5 4.5 0 0 1 2 4"/>`,
  repo: `<path d="M3 13.5V3a1.5 1.5 0 0 1 1.5-1.5H13v10H4.5A1.5 1.5 0 0 0 3 13a1.5 1.5 0 0 0 1.5 1.5H13M6 11.5v3.5l1-1 1 1v-3.5"/>`,
  issue: `<circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="1.2"/>`,
  moon: `<path d="M13 9.5A5.5 5.5 0 1 1 6.5 3a4.5 4.5 0 0 0 6.5 6.5Z"/>`,
  rocket: `<path d="M9.5 2.5c2-1 4-1 4-1s0 2-1 4L8 10 6 8zM6 8 3 7.5l2-2.5h3M8 10l.5 3 2.5-2V8M4.5 11.5 2 14"/>`,
  code: `<path d="m5 4-3.5 4L5 12m6-8 3.5 4L11 12M9.5 2.5l-3 11"/>`,
};

export type GlyphName = keyof typeof glyphs;

export function glyph(name: GlyphName, x: number, y: number, size: number, color: string, extra = ""): string {
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" ${extra}>${glyphs[name]}</svg>`;
}
