import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { woffToSfnt } from "./font.js";

/**
 * Minimal TrueType metrics reader (cmap format 4 + hmtx) so text can be
 * measured exactly for the proportional display face.
 */
export interface FontMetrics {
  unitsPerEm: number;
  advance(codePoint: number): number;
  has(codePoint: number): boolean;
}

function parse(buf: Buffer): FontMetrics {
  const numTables = buf.readUInt16BE(4);
  const tables: Record<string, number> = {};
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    tables[buf.toString("ascii", rec, rec + 4)] = buf.readUInt32BE(rec + 8);
  }
  const unitsPerEm = buf.readUInt16BE(tables.head + 18);
  const numHMetrics = buf.readUInt16BE(tables.hhea + 34);
  const hmtx = tables.hmtx;
  const adv = (gid: number) => buf.readUInt16BE(hmtx + Math.min(gid, numHMetrics - 1) * 4);
  // cmap: find a format-4 subtable (platform 3 encoding 1 or platform 0)
  const cmap = tables.cmap;
  const n = buf.readUInt16BE(cmap + 2);
  let sub = -1;
  for (let i = 0; i < n; i++) {
    const pid = buf.readUInt16BE(cmap + 4 + i * 8);
    const eid = buf.readUInt16BE(cmap + 6 + i * 8);
    const off = buf.readUInt32BE(cmap + 8 + i * 8);
    if (buf.readUInt16BE(cmap + off) === 4 && (pid === 3 || pid === 0) && (eid === 1 || pid === 0)) sub = cmap + off;
  }
  if (sub < 0) throw new Error("no cmap format 4");
  const segX2 = buf.readUInt16BE(sub + 6);
  const ends = sub + 14;
  const starts = ends + segX2 + 2;
  const deltas = starts + segX2;
  const ranges = deltas + segX2;
  const glyph = (cp: number): number => {
    for (let i = 0; i < segX2 / 2; i++) {
      const end = buf.readUInt16BE(ends + i * 2);
      if (cp > end) continue;
      const start = buf.readUInt16BE(starts + i * 2);
      if (cp < start) return 0;
      const delta = buf.readInt16BE(deltas + i * 2);
      const ro = buf.readUInt16BE(ranges + i * 2);
      if (ro === 0) return (cp + delta) & 0xffff;
      const g = buf.readUInt16BE(ranges + i * 2 + ro + (cp - start) * 2);
      return g === 0 ? 0 : (g + delta) & 0xffff;
    }
    return 0;
  };
  return { unitsPerEm, advance: (cp) => adv(glyph(cp)), has: (cp) => glyph(cp) !== 0 };
}

const cache = new Map<string, FontMetrics>();

export function metrics(file: string): FontMetrics {
  let m = cache.get(file);
  if (!m) {
    const path = fileURLToPath(new URL(`../../assets/fonts/${file}.woff`, import.meta.url));
    m = parse(woffToSfnt(readFileSync(path)));
    cache.set(file, m);
  }
  return m;
}

export const displayMetrics = () => metrics("big-shoulders-display-latin-800-normal");

/** Width of text set in the display face at `size`, with optional letter-spacing (px). */
export function displayWidth(text: string, size: number, letterSpacing = 0): number {
  const m = displayMetrics();
  let w = 0;
  for (const ch of text) w += (m.advance(ch.codePointAt(0)!) / m.unitsPerEm) * size + letterSpacing;
  return w;
}
