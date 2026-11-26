import { esc, groupDigits } from "../lib/escape.js";
import { svgFramesToGif } from "../lib/raster.js";
import type { Theme } from "../theme.js";
import type { Ctx, GifWidget } from "./types.js";

const W = 410;
const H = 300;
const FRAMES = 48;
const DELAY = 90;

type V3 = [number, number, number];

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k)));
  return `#${[ch(16), ch(8), ch(0)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** One frame of the isometric contribution city, rotated by `angle` radians. */
export function skylineFrame(t: Theme, weeks: { count: number; level: number }[][], angle: number, title: string, sub: string): string {
  const cols = weeks.length;
  const max = Math.max(1, ...weeks.flat().map((d) => d.count));
  const unit = 6.6;
  const gap = 1.3;
  const elev = (32 * Math.PI) / 180;
  const cx = (cols * unit) / 2;
  const cz = (7 * unit) / 2;
  const scale = 0.98;
  const ox = W / 2;
  const oy = H / 2 + 46;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const ce = Math.cos(elev);
  const se = Math.sin(elev);
  // world: x along weeks, z along weekdays, y up
  const project = ([x, y, z]: V3): [number, number, number] => {
    const px = x - cx;
    const pz = z - cz;
    const rx = px * ca - pz * sa;
    const rz = px * sa + pz * ca;
    // camera looks down by `elev`
    const sy = -y * ce + rz * se;
    const depth = rz * ce + y * se;
    return [ox + rx * scale, oy + sy * scale, depth];
  };
  const faces: { d: number; pts: string; fill: string }[] = [];
  weeks.forEach((w, c) =>
    w.forEach((day, r) => {
      const h = day.count === 0 ? 0.8 : 2 + (day.count / max) * 82;
      const x0 = c * unit + gap / 2;
      const x1 = (c + 1) * unit - gap / 2;
      const z0 = r * unit + gap / 2;
      const z1 = (r + 1) * unit - gap / 2;
      const top = t.heat[day.level as 0];
      const corners: V3[] = [
        [x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1],
        [x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1],
      ];
      const p = corners.map(project);
      const quads: [number[], string, V3][] = [
        [[4, 5, 6, 7], top, [0, 1, 0]],
        [[0, 1, 5, 4], shade(top, 0.62), [0, 0, -1]],
        [[2, 3, 7, 6], shade(top, 0.62), [0, 0, 1]],
        [[1, 2, 6, 5], shade(top, 0.8), [1, 0, 0]],
        [[3, 0, 4, 7], shade(top, 0.8), [-1, 0, 0]],
      ];
      for (const [idx, fill, n] of quads) {
        // back-face cull using the rotated normal's depth component
        const nz = n[0] * sa + n[2] * ca;
        if (n[1] === 0 && nz > 0) continue;
        const depth = idx.reduce((a, i) => a + p[i][2], 0) / 4;
        faces.push({ d: depth, pts: idx.map((i) => `${p[i][0].toFixed(1)},${p[i][1].toFixed(1)}`).join(" "), fill });
      }
    }),
  );
  faces.sort((a, b) => b.d - a.d);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
<circle cx="28" cy="26" r="4" fill="${t.accent}"/>
<text x="40" y="30" font-family="JetBrains Mono" font-weight="700" font-size="12" letter-spacing="2" fill="${t.muted}">${esc(title)}</text>
<text x="${W - 20}" y="30" font-family="JetBrains Mono" font-size="11" text-anchor="end" fill="${t.muted}">${esc(sub)}</text>
${faces.map((f) => `<polygon points="${f.pts}" fill="${f.fill}" stroke="${f.fill}" stroke-width=".4" stroke-linejoin="round"/>`).join("")}
</svg>`;
}

export const skyline: GifWidget = {
  kind: "gif",
  name: "skyline",
  alt: "3D contribution skyline",
  render(ctx: Ctx) {
    const weeks = ctx.data.weeks.slice(-53);
    const sub = `${groupDigits(ctx.data.lastYearTotal).replace(/ /g, " ")} contributions`;
    const frames = Array.from({ length: FRAMES }, (_, i) => ({
      svg: skylineFrame(ctx.theme, weeks, (i / FRAMES) * Math.PI * 2 + 0.5, "3D SKYLINE", sub),
      delay: DELAY,
    }));
    return svgFramesToGif(frames);
  },
};
