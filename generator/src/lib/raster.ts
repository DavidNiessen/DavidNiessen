import { Resvg } from "@resvg/resvg-js";
import { ttfFontFiles } from "./font.js";
import { encodeGif, type Frame } from "./gif.js";

let fonts: string[] | null = null;

/** Rasterise an SVG string to RGBA pixels with the vendored fonts. */
export function rasterize(svg: string): { rgba: Uint8Array; width: number; height: number } {
  fonts ??= ttfFontFiles();
  const r = new Resvg(svg, { font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: "JetBrains Mono" } });
  const img = r.render();
  return { rgba: new Uint8Array(img.pixels), width: img.width, height: img.height };
}

/** Render SVG frames and encode them as a looping GIF. */
export function svgFramesToGif(frames: { svg: string; delay: number }[]): Buffer {
  let w = 0;
  let h = 0;
  const raster: Frame[] = frames.map((f) => {
    const r = rasterize(f.svg);
    w = r.width;
    h = r.height;
    return { rgba: r.rgba, delay: f.delay };
  });
  return encodeGif(w, h, raster);
}
