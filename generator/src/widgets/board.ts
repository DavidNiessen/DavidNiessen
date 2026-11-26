import { localParts, pad2 } from "../lib/astro.js";
import { esc } from "../lib/escape.js";
import { rng } from "../data/mock.js";
import { label, svg } from "../lib/svg.js";
import type { ActivityEvent, EventKind } from "../data/types.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 840;
const CW = 11.5;
const GAP = 1.6;
const CH = 22;
const ROW = 32;
const COLS = [
  { key: "time", label: "TIME", n: 5 },
  { key: "event", label: "EVENT", n: 7 },
  { key: "repo", label: "REPOSITORY", n: 16 },
  { key: "detail", label: "DETAIL", n: 18 },
  { key: "status", label: "STATUS", n: 8 },
] as const;

const KIND: Record<EventKind, [string, string]> = {
  push: ["PUSH", "ON TIME"],
  merge: ["MERGE", "MERGED"],
  pr: ["PR", "BOARDING"],
  review: ["REVIEW", "CHECKED"],
  release: ["RELEASE", "DEPARTED"],
  issue: ["ISSUE", "OPEN"],
  create: ["CREATE", "NEW"],
  star: ["STAR", "STARRED"],
  fork: ["FORK", "FORKED"],
  other: ["EVENT", "—"],
};

const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function fit(s: string, n: number): string {
  const up = s.toUpperCase();
  return up.length > n ? up.slice(0, n) : up.padEnd(n, " ");
}

/** Split-flap departure board of the latest public GitHub events. */
export const board: SvgWidget = {
  kind: "svg",
  name: "board",
  alt: "recent activity departure board",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const events: ActivityEvent[] = ctx.data.events.slice(0, 6);
    const rows = events.length ? events : [{ kind: "other" as EventKind, repo: "quiet day", detail: "no public events", time: ctx.date.toISOString() }];
    const r = rng(99);
    const x0 = 30;
    const colX: number[] = [];
    let cx = x0;
    for (const c of COLS) {
      colX.push(cx);
      cx += c.n * (CW + GAP) + 14;
    }
    const y0 = 86;
    const H = y0 + rows.length * ROW + 34;
    const today = localParts(ctx.date);
    const cells: string[] = [];
    rows.forEach((ev, ri) => {
      const lt = localParts(new Date(ev.time));
      const sameDay = lt.year === today.year && lt.month === today.month && lt.day === today.day;
      const [kind, status] = KIND[ev.kind];
      const values: Record<string, string> = {
        time: sameDay ? `${pad2(lt.hour)}:${pad2(lt.minute)}` : `${pad2(lt.day)}.${pad2(lt.month)}`,
        event: kind,
        repo: ev.repo,
        detail: ev.detail,
        status: ri === 0 && ev.kind !== "other" ? "LATEST" : status,
      };
      COLS.forEach((col, ci) => {
        const text = fit(values[col.key], col.n);
        [...text].forEach((ch, k) => {
          const x = colX[ci] + k * (CW + GAP);
          const y = y0 + ri * ROW;
          const d = 0.4 + ri * 0.16 + (ci * 6 + k) * 0.012 + r() * 0.25;
          const color = col.key === "status" ? (ri === 0 ? t.glow : t.accent) : col.key === "time" ? t.muted : t.text;
          const scramble = SCRAMBLE[Math.floor(r() * SCRAMBLE.length)];
          const blink = col.key === "status" && ri === 0 ? ` class="blink loop" style="animation-delay:${(d + 1).toFixed(2)}s"` : "";
          cells.push(`<g><rect x="${x.toFixed(1)}" y="${y}" width="${CW}" height="${CH}" rx="2" fill="${t.raised}"/>
<g style="transform-box:fill-box;transform-origin:center;animation:flip .32s ease-out ${d.toFixed(2)}s both">
<text x="${(x + CW / 2).toFixed(1)}" y="${y + 15.5}" font-size="13" text-anchor="middle" class="b m" style="animation:off .01s ${d.toFixed(2)}s both">${esc(scramble)}</text>
<text x="${(x + CW / 2).toFixed(1)}" y="${y + 15.5}" font-size="13" text-anchor="middle" class="b" fill="${color}" style="animation:on .01s ${d.toFixed(2)}s both"><tspan${blink}>${esc(ch === " " ? " " : ch)}</tspan></text>
</g>
<rect x="${x.toFixed(1)}" y="${y + CH / 2 - 0.5}" width="${CW}" height="1" fill="${t.card}" opacity=".9"/></g>`);
        });
      });
    });
    const heads = COLS.map((c, i) => `<text x="${colX[i]}" y="${y0 - 10}" font-size="10" letter-spacing="1.5" class="m">${c.label}</text>`).join("");
    const css = `@keyframes flip{0%{transform:scaleY(1)}40%{transform:scaleY(.05)}100%{transform:scaleY(1)}}
@keyframes off{to{opacity:0}}@keyframes on{from{opacity:0}to{opacity:1}}`;
    const clock = `${pad2(ctx.now.hour)}:${pad2(ctx.now.minute)}`;
    const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
${label(t, 24, 30, "departures · latest activity")}
<text x="${W - 24}" y="31" font-size="14" text-anchor="end" class="t b">${clock}</text>
<text x="${W - 84}" y="31" font-size="10.5" text-anchor="end" letter-spacing="1" class="m">GITHUB.COM/${esc(ctx.config.login.toUpperCase())}</text>
${heads}
${cells.join("")}
<text x="${x0}" y="${H - 16}" font-size="10" class="m">public events · refreshed nightly</text>`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, body });
  },
};
