import { esc } from "../lib/escape.js";
import { svgFramesToGif } from "../lib/raster.js";
import type { Ctx, GifWidget } from "./types.js";

const W = 410;
const H = 300;
const COLS = 66;
const ROWS = 40;
const CELL = 5.6;
const GENS = 96;
const DELAY = 110;

/**
 * Seed a toroidal Life board with the contribution calendar: the 53×7
 * grid is stamped three times (shifted) so the pattern has room to evolve.
 * Days at level ≥ 2 start alive.
 */
export function seedBoard(weeks: { level: number }[][]): Uint8Array {
  const board = new Uint8Array(COLS * ROWS);
  const stamps = [
    [6, 5],
    [2, 16],
    [10, 27],
  ];
  for (const [dx, dy] of stamps) {
    weeks.forEach((w, c) =>
      w.forEach((d, r) => {
        if (d.level >= 2) board[((dy + r) % ROWS) * COLS + ((dx + c) % COLS)] = 1;
      }),
    );
  }
  return board;
}

export function step(board: Uint8Array): Uint8Array {
  const next = new Uint8Array(board.length);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (dx || dy) n += board[((y + dy + ROWS) % ROWS) * COLS + ((x + dx + COLS) % COLS)];
        }
      const alive = board[y * COLS + x];
      next[y * COLS + x] = n === 3 || (alive && n === 2) ? 1 : 0;
    }
  }
  return next;
}

export const life: GifWidget = {
  kind: "gif",
  name: "life",
  alt: "Conway's Game of Life seeded with contributions",
  render(ctx: Ctx) {
    const t = ctx.theme;
    let board = seedBoard(ctx.data.weeks.slice(-53));
    // age since death per cell, for fading trails
    const fade = new Uint8Array(board.length).fill(255);
    const frames: { svg: string; delay: number }[] = [];
    const ox = (W - COLS * CELL) / 2;
    const oy = 46;
    const trail = [t.heat[3], t.heat[2], t.heat[1]];
    for (let g = 0; g < GENS; g++) {
      const pop = board.reduce((a, v) => a + v, 0);
      const cells: string[] = [];
      for (let i = 0; i < board.length; i++) {
        const x = ox + (i % COLS) * CELL;
        const y = oy + Math.floor(i / COLS) * CELL;
        let fill: string;
        if (board[i]) fill = t.glow;
        else if (fade[i] < trail.length) fill = trail[fade[i]];
        else fill = t.heat[0];
        cells.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${CELL - 1.2}" height="${CELL - 1.2}" rx="1.2" fill="${fill}"/>`);
      }
      frames.push({
        delay: g === 0 ? 1400 : DELAY,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
<circle cx="28" cy="26" r="4" fill="${t.accent}"/>
<text x="40" y="30" font-family="JetBrains Mono" font-weight="700" font-size="12" letter-spacing="2" fill="${t.muted}">GAME OF LIFE</text>
<text x="${W - 20}" y="30" font-family="JetBrains Mono" font-size="11" text-anchor="end" fill="${t.muted}">${esc(`gen ${String(g).padStart(2, "0")} · pop ${pop}`)}</text>
${cells.join("")}
<text x="${W / 2}" y="${H - 14}" font-family="JetBrains Mono" font-size="10" text-anchor="middle" fill="${t.muted}">seeded with this year's contribution calendar</text>
</svg>`,
      });
      const next = step(board);
      for (let i = 0; i < board.length; i++) {
        if (next[i]) fade[i] = 255;
        else if (board[i]) fade[i] = 0;
        else if (fade[i] < 255) fade[i] = Math.min(255, fade[i] + 1);
      }
      board = next;
    }
    return svgFramesToGif(frames);
  },
};
