/**
 * A small, dependency-free animated GIF89a encoder:
 * median-cut palette over all frames, cached nearest-colour mapping,
 * transparent pixels (alpha < 50%) and unchanged pixels share palette
 * index 0, and LZW compression. Pixels that are transparent in one frame
 * must stay transparent in all frames (e.g. rounded card corners).
 */

export interface Frame {
  /** RGBA pixels, width*height*4 */
  rgba: Uint8Array;
  /** delay in milliseconds */
  delay: number;
}

type RGB = [number, number, number];

/** A colour bucket: pixel count and summed channels (for an exact average colour). */
export interface Bucket {
  n: number;
  r: number;
  g: number;
  b: number;
}

const avg = (e: Bucket): RGB => [Math.round(e.r / e.n), Math.round(e.g / e.n), Math.round(e.b / e.n)];

/** Median-cut quantisation of colour buckets to at most `max` colours. */
export function medianCut(entries: Bucket[], max: number): RGB[] {
  if (max <= 0 || !entries.length) return [];
  if (entries.length <= max) return entries.map(avg);
  type Box = Bucket[];
  let boxes: Box[] = [entries];
  while (boxes.length < max) {
    let best = -1;
    let bestScore = -1;
    let bestCh = 0;
    boxes.forEach((box, i) => {
      if (box.length < 2) return;
      for (let ch = 0; ch < 3; ch++) {
        let lo = 255;
        let hi = 0;
        let pop = 0;
        for (const e of box) {
          const v = avg(e)[ch];
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
          pop += e.n;
        }
        const score = (hi - lo) * Math.sqrt(pop);
        if (score > bestScore) {
          bestScore = score;
          best = i;
          bestCh = ch;
        }
      }
    });
    if (best < 0) break;
    const box = [...boxes[best]].sort((a, b) => avg(a)[bestCh] - avg(b)[bestCh]);
    // split at the population median, but always leave both halves non-empty
    const total = box.reduce((a, e) => a + e.n, 0);
    let acc = 0;
    let cut = 1;
    for (let i = 0; i < box.length - 1; i++) {
      acc += box[i].n;
      cut = i + 1;
      if (acc >= total / 2) break;
    }
    boxes = [...boxes.slice(0, best), box.slice(0, cut), box.slice(cut), ...boxes.slice(best + 1)];
  }
  return boxes.map((box) => avg(box.reduce((a, e) => ({ n: a.n + e.n, r: a.r + e.r, g: a.g + e.g, b: a.b + e.b }), { n: 0, r: 0, g: 0, b: 0 })));
}

/**
 * Palette for flat-colour graphics: the most frequent colours get exact
 * entries (so backgrounds and fills never drift), the long tail of
 * anti-aliasing shades is median-cut into the remaining slots.
 */
export function buildPalette(hist: Map<number, Bucket>, max: number): RGB[] {
  const sorted = [...hist.values()].sort((a, b) => b.n - a.n);
  const exact = Math.min(sorted.length, Math.ceil(max / 2));
  return [...sorted.slice(0, exact).map(avg), ...medianCut(sorted.slice(exact), max - exact)];
}

/** Variable-width LZW as specified for GIF image data. */
export function lzw(indices: Uint8Array, minCodeSize: number): Uint8Array {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  const out: number[] = [];
  let bitBuf = 0;
  let bitCount = 0;
  let codeSize = minCodeSize + 1;
  const emit = (code: number) => {
    bitBuf |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      out.push(bitBuf & 255);
      bitBuf >>>= 8;
      bitCount -= 8;
    }
  };
  let dict = new Map<number, number>();
  let next = eoi + 1;
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (prefix << 8) | k;
    const hit = dict.get(key);
    if (hit !== undefined) {
      prefix = hit;
      continue;
    }
    emit(prefix);
    if (next < 4096) {
      dict.set(key, next++);
      if (next > 1 << codeSize && codeSize < 12) codeSize++;
    } else {
      emit(clear);
      dict = new Map();
      next = eoi + 1;
      codeSize = minCodeSize + 1;
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoi);
  if (bitCount > 0) out.push(bitBuf & 255);
  return Uint8Array.from(out);
}

class Bytes {
  private parts: number[] = [];
  byte(b: number) {
    this.parts.push(b & 255);
  }
  word(w: number) {
    this.byte(w);
    this.byte(w >> 8);
  }
  str(s: string) {
    for (const c of s) this.byte(c.charCodeAt(0));
  }
  bytes(a: ArrayLike<number>) {
    for (let i = 0; i < a.length; i++) this.parts.push(a[i]);
  }
  /** data split into ≤255-byte sub-blocks with terminator */
  blocks(a: Uint8Array) {
    for (let i = 0; i < a.length; i += 255) {
      const n = Math.min(255, a.length - i);
      this.byte(n);
      this.bytes(a.subarray(i, i + n));
    }
    this.byte(0);
  }
  buffer(): Buffer {
    return Buffer.from(this.parts);
  }
}

/** Encode RGBA frames into a looping animated GIF. */
export function encodeGif(width: number, height: number, frames: Frame[]): Buffer {
  // histogram over a sample of every frame
  const hist = new Map<number, Bucket>();
  for (const f of frames) {
    for (let i = 0; i < f.rgba.length; i += 4 * 2) {
      if (f.rgba[i + 3] < 128) continue;
      const r = f.rgba[i];
      const g = f.rgba[i + 1];
      const b = f.rgba[i + 2];
      const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      const e = hist.get(k);
      if (e) {
        e.n++;
        e.r += r;
        e.g += g;
        e.b += b;
      } else hist.set(k, { n: 1, r, g, b });
    }
  }
  // index 0 is reserved for "transparent / unchanged"
  const palette = buildPalette(hist, 255);
  const cache = new Map<number, number>();
  const nearest = (r: number, g: number, b: number): number => {
    const k = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
    let idx = cache.get(k);
    if (idx === undefined) {
      let best = Infinity;
      idx = 1;
      for (let i = 0; i < palette.length; i++) {
        const p = palette[i];
        const d = (p[0] - r) ** 2 * 0.3 + (p[1] - g) ** 2 * 0.59 + (p[2] - b) ** 2 * 0.11;
        if (d < best) {
          best = d;
          idx = i + 1;
        }
      }
      cache.set(k, idx);
    }
    return idx;
  };
  const out = new Bytes();
  out.str("GIF89a");
  out.word(width);
  out.word(height);
  out.byte(0xf7); // global colour table, 8 bits, 256 entries
  out.byte(0);
  out.byte(0);
  out.bytes([0, 0, 0]);
  for (let i = 0; i < 255; i++) out.bytes(palette[i] ?? [0, 0, 0]);
  // NETSCAPE2.0 infinite loop
  out.bytes([0x21, 0xff, 0x0b]);
  out.str("NETSCAPE2.0");
  out.bytes([3, 1, 0, 0, 0]);
  let prev: Uint8Array | null = null;
  for (const f of frames) {
    const idx = new Uint8Array(width * height);
    for (let p = 0, i = 0; p < idx.length; p++, i += 4) {
      const v = f.rgba[i + 3] < 128 ? 0 : nearest(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2]);
      idx[p] = prev && prev[p] === v ? 0 : v;
    }
    const full = new Uint8Array(idx.length);
    for (let p = 0; p < idx.length; p++) full[p] = idx[p] === 0 && prev ? prev[p] : idx[p];
    // graphic control: disposal 1 (keep), transparent index 0
    out.bytes([0x21, 0xf9, 4, 0x05]);
    out.word(Math.round(f.delay / 10));
    out.byte(0);
    out.byte(0);
    out.byte(0x2c);
    out.word(0);
    out.word(0);
    out.word(width);
    out.word(height);
    out.byte(0);
    out.byte(8);
    out.blocks(lzw(idx, 8));
    prev = full;
  }
  out.byte(0x3b);
  return out.buffer();
}
