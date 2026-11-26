import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { inflateSync } from "node:zlib";

/** JetBrains Mono (SIL OFL 1.1), latin subset, vendored in assets/fonts. */
const fontDir = fileURLToPath(new URL("../../assets/fonts/", import.meta.url));

export const FONT_FAMILY = "JBMono";
export const FONT_STACK = `${FONT_FAMILY}, 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

export type Weight = 400 | 700;

const cache = new Map<Weight, string>();

function woff2Base64(weight: Weight): string {
  let b64 = cache.get(weight);
  if (!b64) {
    b64 = readFileSync(join(fontDir, `jetbrains-mono-latin-${weight}-normal.woff2`)).toString("base64");
    cache.set(weight, b64);
  }
  return b64;
}

/** @font-face rules embedding JetBrains Mono as data URIs (SVG <img> cannot load external fonts). */
export function fontFaceCss(weights: Weight[] = [400, 700]): string {
  return weights
    .map(
      (w) =>
        `@font-face{font-family:${FONT_FAMILY};font-weight:${w};font-style:normal;src:url(data:font/woff2;base64,${woff2Base64(w)}) format('woff2');}`,
    )
    .join("");
}

/**
 * Convert a WOFF 1.0 file into a plain SFNT (TTF/OTF) buffer.
 * resvg only understands SFNT fonts; the repo vendors WOFF/WOFF2.
 */
export function woffToSfnt(woff: Buffer): Buffer {
  if (woff.toString("ascii", 0, 4) !== "wOFF") throw new Error("not a WOFF file");
  const flavor = woff.readUInt32BE(4);
  const numTables = woff.readUInt16BE(12);
  const tables: { tag: number; checksum: number; data: Buffer }[] = [];
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const tag = woff.readUInt32BE(o);
    const offset = woff.readUInt32BE(o + 4);
    const compLength = woff.readUInt32BE(o + 8);
    const origLength = woff.readUInt32BE(o + 12);
    const checksum = woff.readUInt32BE(o + 16);
    const raw = woff.subarray(offset, offset + compLength);
    const data = compLength < origLength ? inflateSync(raw) : Buffer.from(raw);
    tables.push({ tag, checksum, data });
  }
  const entrySelector = Math.floor(Math.log2(numTables));
  const searchRange = 2 ** entrySelector * 16;
  const header = Buffer.alloc(12 + numTables * 16);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(numTables, 4);
  header.writeUInt16BE(searchRange, 6);
  header.writeUInt16BE(entrySelector, 8);
  header.writeUInt16BE(numTables * 16 - searchRange, 10);
  const chunks: Buffer[] = [header];
  let offset = header.length;
  tables.forEach((t, i) => {
    const rec = 12 + i * 16;
    header.writeUInt32BE(t.tag, rec);
    header.writeUInt32BE(t.checksum, rec + 4);
    header.writeUInt32BE(offset, rec + 8);
    header.writeUInt32BE(t.data.length, rec + 12);
    const padded = Buffer.alloc((t.data.length + 3) & ~3);
    t.data.copy(padded);
    chunks.push(padded);
    offset += padded.length;
  });
  return Buffer.concat(chunks);
}

/** Paths to TTF copies of JetBrains Mono for raster rendering (resvg). */
export function ttfFontFiles(): string[] {
  const dir = join(tmpdir(), "profile-generator-fonts");
  mkdirSync(dir, { recursive: true });
  return ([400, 700] as Weight[]).map((w) => {
    const out = join(dir, `jetbrains-mono-${w}.ttf`);
    if (!existsSync(out)) {
      writeFileSync(out, woffToSfnt(readFileSync(join(fontDir, `jetbrains-mono-latin-${w}-normal.woff`))));
    }
    return out;
  });
}
