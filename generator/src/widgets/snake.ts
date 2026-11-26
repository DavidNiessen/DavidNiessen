import { label, svg } from "../lib/svg.js";
import type { ContributionDay } from "../data/types.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 840;
const H = 196;
const CELL = 11;
const STEP = 14;
const GX = 47;
const GY = 58;
const LENGTH = 7;
const STEP_S = 0.07;

type P = [number, number];

/**
 * Plan the snake's route: start off-grid on the left, repeatedly BFS to the
 * nearest uneaten non-empty cell within the leftmost remaining columns,
 * finally leave off-grid on the right. Returns grid positions per step and
 * the step index at which every cell gets eaten.
 */
export function planRoute(cols: number, rows: number, food: Set<string>): { path: P[]; eatenAt: Map<string, number> } {
  const key = (c: number, r: number) => `${c},${r}`;
  const path: P[] = [];
  for (let i = LENGTH; i > 0; i--) path.push([-i, 3]);
  let pos: P = [0, 3];
  path.push(pos);
  const remaining = new Set(food);
  const eatenAt = new Map<string, number>();
  const eat = (p: P) => {
    const k = key(p[0], p[1]);
    if (remaining.delete(k)) eatenAt.set(k, path.length - 1);
  };
  eat(pos);
  while (remaining.size) {
    // only cells near the leftmost remaining column count as targets → a clean left-to-right sweep
    let minCol = Infinity;
    for (const k of remaining) minCol = Math.min(minCol, Number(k.split(",")[0]));
    // BFS on the open grid
    const prev = new Map<string, string | null>([[key(pos[0], pos[1]), null]]);
    const queue: P[] = [pos];
    let target: P | null = null;
    for (let qi = 0; qi < queue.length && !target; qi++) {
      const [c, r] = queue[qi];
      const next: P[] = [
        [c + 1, r],
        [c, r + 1],
        [c, r - 1],
        [c - 1, r],
      ];
      for (const [nc, nr] of next) {
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        const k = key(nc, nr);
        if (prev.has(k)) continue;
        prev.set(k, key(c, r));
        if (remaining.has(k) && nc <= minCol + 1) {
          target = [nc, nr];
          break;
        }
        queue.push([nc, nr]);
      }
    }
    if (!target) break;
    const seg: P[] = [];
    let k: string | null = key(target[0], target[1]);
    while (k && k !== key(pos[0], pos[1])) {
      const [c, r] = k.split(",").map(Number);
      seg.unshift([c, r]);
      k = prev.get(k) ?? null;
    }
    for (const p of seg) {
      path.push(p);
      eat(p);
    }
    pos = target;
  }
  // exit to the right along the current row
  for (let c = pos[0] + 1; c < cols + LENGTH + 1; c++) path.push([c, pos[1]]);
  return { path, eatenAt };
}

export const snake: SvgWidget = {
  kind: "svg",
  name: "snake",
  alt: "contribution snake",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const weeks: ContributionDay[][] = ctx.data.weeks.slice(-53);
    const cols = weeks.length;
    const food = new Set<string>();
    const level = new Map<string, number>();
    weeks.forEach((w, c) => w.forEach((d) => {
      level.set(`${c},${d.weekday}`, d.level);
      if (d.count > 0) food.add(`${c},${d.weekday}`);
    }));
    const { path, eatenAt } = planRoute(cols, 7, food);
    const steps = path.length;
    const pause = 3; // seconds the empty grid stays before the next round
    const T = steps * STEP_S + pause;
    const pct = (s: number) => ((s * STEP_S) / T) * 100;
    const xy = ([c, r]: P) => [GX + c * STEP, GY + r * STEP];

    // head keyframes (translate of a segment drawn at the origin)
    const frames = path
      .map((p, i) => {
        const [x, y] = xy(p);
        return `${pct(i).toFixed(3)}%{transform:translate(${x}px,${y}px)}`;
      })
      .join("");
    const [ex, ey] = xy(path[path.length - 1]);
    const snakeKf = `@keyframes sn{${frames}100%{transform:translate(${ex}px,${ey}px)}}`;

    const cells: string[] = [];
    const eatKf: string[] = [];
    let n = 0;
    weeks.forEach((w, c) =>
      w.forEach((d) => {
        const k = `${c},${d.weekday}`;
        const x = GX + c * STEP;
        const y = GY + d.weekday * STEP;
        const at = eatenAt.get(k);
        if (at === undefined) {
          cells.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${t.heat[0]}"/>`);
          return;
        }
        const id = `e${n++}`;
        const p = pct(at + 1);
        const back = 100 - (pause / T) * 100 * 0.4;
        eatKf.push(
          `@keyframes ${id}{0%,${p.toFixed(3)}%{fill:${t.heat[d.level]}}${(p + 0.01).toFixed(3)}%,${back.toFixed(3)}%{fill:${t.heat[0]}}100%{fill:${t.heat[d.level]}}}`,
        );
        cells.push(`<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${t.heat[d.level]}" class="loop" style="animation:${id} ${T.toFixed(2)}s linear infinite"/>`);
      }),
    );

    const segs = Array.from({ length: LENGTH }, (_, i) => {
      const shrink = i * 0.55;
      const s = CELL + 1 - shrink;
      const o = (CELL - s) / 2;
      const color = i === 0 ? t.glow : t.accent;
      const op = (1 - i * 0.09).toFixed(2);
      return `<g class="loop" style="animation:sn ${T.toFixed(2)}s linear ${(i * STEP_S).toFixed(2)}s infinite both"><rect x="${o.toFixed(1)}" y="${o.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" rx="${(s / 2.6).toFixed(1)}" fill="${color}" opacity="${op}"${i === 0 ? ' filter="url(#glow)"' : ""}/>${
        i === 0 ? `<circle cx="${CELL * 0.68}" cy="${CELL * 0.34}" r="1.3" fill="${t.bg}"/><circle cx="${CELL * 0.68}" cy="${CELL * 0.7}" r="1.3" fill="${t.bg}"/>` : ""
      }</g>`;
    }).reverse();

    const css = `${snakeKf}${eatKf.join("")}`;
    const defs = `<clipPath id="board"><rect x="${GX - 3}" y="${GY - 3}" width="${cols * STEP + 3}" height="${7 * STEP + 3}" rx="4"/></clipPath>`;
    const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
${label(t, 24, 30, `snake · eats ${food.size} active days`)}
<text x="${W - 24}" y="30" font-size="12" text-anchor="end" class="m">${steps} moves · ${Math.round(T)}s per round</text>
${cells.join("")}
<g clip-path="url(#board)">${segs.join("")}</g>`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, defs, body });
  },
};
