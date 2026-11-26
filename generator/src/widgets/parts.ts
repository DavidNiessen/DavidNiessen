import type { Theme } from "../theme.js";

/**
 * Moon disc with the correct terminator for the phase (0 new → .5 full → 1 new).
 * Drawn as a lit half-disc plus an elliptical bulge whose width follows the phase.
 */
export function moonGlyph(t: Theme, cx: number, cy: number, r: number, phase: number): string {
  const lit = t.name === "dark" ? "#f4f4f5" : "#3f3f46";
  const dark = t.name === "dark" ? "#27272a" : "#e4e4e7";
  const waxing = phase < 0.5;
  const k = Math.cos(2 * Math.PI * phase); // 1 new, -1 full
  const rx = Math.abs(k) * r;
  // outer lit edge: right side when waxing, left when waning (northern hemisphere)
  const sweepOuter = waxing ? 1 : 0;
  // terminator bulges toward the lit side when gibbous (k<0), away when crescent
  const sweepInner = (k < 0) === waxing ? 1 : 0;
  const d = `M${cx} ${cy - r}A${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy + r}A${rx.toFixed(2)} ${r} 0 0 ${sweepInner} ${cx} ${cy - r}Z`;
  return `<g><circle cx="${cx}" cy="${cy}" r="${r}" fill="${dark}"/><path d="${d}" fill="${lit}"/><circle cx="${cx}" cy="${cy}" r="${r}" stroke="${t.subtle}" stroke-width=".8"/></g>`;
}
