import { describe, expect, it } from "vitest";
import { encodeGif, lzw } from "../src/lib/gif.js";

/** Reference GIF LZW decoder (independent of the encoder) for round-trip checks. */
function unlzw(data: Uint8Array, minCodeSize: number, count: number): number[] {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  let size = minCodeSize + 1;
  let dict: number[][] = [];
  const reset = () => {
    dict = Array.from({ length: clear + 2 }, (_, i) => (i < clear ? [i] : []));
    size = minCodeSize + 1;
  };
  reset();
  const out: number[] = [];
  let bit = 0;
  let prev: number[] | null = null;
  const read = () => {
    let v = 0;
    for (let i = 0; i < size; i++, bit++) v |= ((data[bit >> 3] >> (bit & 7)) & 1) << i;
    return v;
  };
  while (out.length < count) {
    const code = read();
    if (code === clear) {
      reset();
      prev = null;
      continue;
    }
    if (code === eoi) break;
    let entry: number[];
    if (code < dict.length) entry = dict[code];
    else entry = [...prev!, prev![0]];
    out.push(...entry);
    if (prev) dict.push([...prev, entry[0]]);
    prev = entry;
    if (dict.length === 1 << size && size < 12) size++;
  }
  return out;
}

describe("gif encoder", () => {
  it("LZW round-trips long, repetitive input (including table resets)", () => {
    const input = new Uint8Array(60_000);
    let s = 7;
    for (let i = 0; i < input.length; i++) {
      s = (s * 1103515245 + 12345) >>> 0;
      input[i] = i % 97 < 40 ? 3 : (s >>> 16) % 200;
    }
    expect(unlzw(lzw(input, 8), 8, input.length)).toEqual([...input]);
  });

  it("writes a looping GIF89a with every frame", () => {
    const frame = (v: number) => ({ rgba: new Uint8Array(4 * 4 * 4).map((_, i) => (i % 4 === 3 ? 255 : v)), delay: 100 });
    const gif = encodeGif(4, 4, [frame(10), frame(200), frame(10)]);
    expect(gif.subarray(0, 6).toString("ascii")).toBe("GIF89a");
    expect(gif.includes(Buffer.from("NETSCAPE2.0"))).toBe(true);
    expect(gif.filter((b, i) => b === 0x21 && gif[i + 1] === 0xf9).length).toBe(3);
    expect(gif[gif.length - 1]).toBe(0x3b);
  });
});
