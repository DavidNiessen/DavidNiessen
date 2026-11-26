/**
 * A small, dependency-free animated GIF89a encoder:
 * median-cut palette over all frames, cached nearest-colour mapping,
 * frame-to-frame transparency for unchanged pixels, and LZW compression.
 */

export interface Frame {
  /** RGBA pixels, width*height*4 */
  rgba: Uint8Array;
  /** delay in milliseconds */
  delay: number;
}

type RGB = [number, number, number];

/** Median-cut quantisation of a colour histogram (15-bit buckets) to at most `max` colours. */
export function medianCut(hist: Map<number, number>, max: number): RGB[] {
  type Box = { colors: { c: RGB; n: number }[] };
  const all = [...hist.entries()].map(([k, n]) => ({ c: [((k >> 10) & 31) << 3, ((k >> 5) & 31) << 3, (k & 31) << 3] as RGB, n }));
  if (all.length <= max) return all.map((e) => [e.c[0] + 4, e.c[1] + 4, e.c[2] + 4].map((v) => Math.min(255, v)) as RGB);
  let boxes: Box[] = [{ colors: all }];
  while (boxes.length < max) {
    // split the box with the largest (range × population)
    let best = -1;
    let bestScore = -1;
    let bestCh = 0;
    boxes.forEach((b, i) => {
      if (b.colors.length < 2) return;
      for (let ch = 0; ch < 3; ch++) {
        let lo = 255;
        let hi = 0;
        let pop = 0;
        for (const e of b.colors) {
          lo = Math.min(lo, e.c[ch]);
          hi = Math.max(hi, e.c[ch]);
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
    const box = boxes[best];
    box.colors.sort((a, b) => a.c[bestCh] - b.c[bestCh]);
    const total = box.colors.reduce((a, e) => a + e.n, 0);
    let acc = 0;
    let cut = 1;
    for (let i = 0; i < box.colors.length - 1; i++) {
      acc += box.colors[i].n;
      if (acc >= total / 2) {
        cut = i + 1;
        break;
      }
    }
    boxes = [...boxes.slice(0, best), { colors: box.colors.slice(0, cut) }, { colors: box.colors.slice(cut) }, ...boxes.slice(best + 1)];
  }
  return boxes.map((b) => {
    let r = 0;
    let g = 0;
    let bl = 0;
    let n = 0;
    for (const e of b.colors) {
      r += e.c[0] * e.n;
      g += e.c[1] * e.n;
      bl += e.c[2] * e.n;
      n += e.n;
    }
    return [Math.round(r / n) + 4, Math.round(g / n) + 4, Math.round(bl / n) + 4].map((v) => Math.min(255, v)) as RGB;
  });
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
  const hist = new Map<number, number>();
  for (const f of frames) {
    for (let i = 0; i < f.rgba.length; i += 4 * 3) {
      const k = ((f.rgba[i] >> 3) << 10) | ((f.rgba[i + 1] >> 3) << 5) | (f.rgba[i + 2] >> 3);
      hist.set(k, (hist.get(k) ?? 0) + 1);
    }
  }
  // index 0 is reserved for "transparent / unchanged"
  const palette = medianCut(hist, 255);
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
      const v = nearest(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2]);
      idx[p] = prev && prev[p] === v ? 0 : v;
    }
    const full = new Uint8Array(idx.length);
    for (let p = 0; p < idx.length; p++) full[p] = idx[p] === 0 && prev ? prev[p] : idx[p];
    // graphic control: disposal 1 (keep), transparent index 0 after the first frame
    out.bytes([0x21, 0xf9, 4, prev ? 0x05 : 0x04]);
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
