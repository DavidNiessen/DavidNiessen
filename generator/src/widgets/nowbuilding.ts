import { ago, esc, wrap } from "../lib/escape.js";
import { label, svg } from "../lib/svg.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 840;
const H = 230;

/** The most recently pushed public repository, with an animated git graph and its recent activity. */
export const nowBuilding: SvgWidget = {
  kind: "svg",
  name: "now",
  alt: "now building",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const repo = ctx.data.repos.find((r) => r.name.toLowerCase() !== ctx.config.login.toLowerCase() && !r.name.startsWith(".")) ?? null;
    // short pseudo commit hash, stable for a given repo + push
    const seed = `${repo?.name ?? ""}${repo?.pushedAt ?? ""}`;
    let h = 2166136261;
    for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const sha = (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
    const lang = repo?.language?.color || t.glow;

    // git graph: main line, a feature branch that forks and merges back
    const mainY = 140;
    const featY = 84;
    const branch = `M78 ${mainY}C100 ${mainY} 100 ${featY} 122 ${featY}H178C200 ${featY} 200 ${mainY} 222 ${mainY}`;
    const mainNodes = [40, 78, 222, 252];
    const featNodes = [134, 166];
    const node = (x: number, y: number, i: number, color: string) =>
      `<circle cx="${x}" cy="${y}" r="7" fill="${t.card}" stroke="${color}" stroke-width="2.5" class="fx" style="animation:pop .45s cubic-bezier(.3,1.4,.5,1) ${(0.3 + i * 0.18).toFixed(2)}s both"/>`;
    const graph = `<path d="M24 ${mainY}H262" stroke="${t.subtle}" stroke-width="3" stroke-linecap="round"/>
<path d="M24 ${mainY}H262" stroke="${t.accent}" stroke-width="3" stroke-dasharray="3 9" class="loop" style="animation:flow 1.2s linear infinite"/>
<path d="${branch}" stroke="${lang}" stroke-width="3" stroke-linecap="round" stroke-dasharray="220" stroke-dashoffset="220" style="animation:draw 1.2s cubic-bezier(.2,.7,.2,1) .5s forwards"/>
<circle r="3.5" fill="${t.glow}" filter="url(#glow)" opacity="0"><animateMotion dur="3.2s" begin="1.8s" repeatCount="indefinite" path="${branch}"/><set attributeName="opacity" to="1" begin="1.8s"/></circle>
${mainNodes.slice(0, 3).map((x, i) => node(x, mainY, i, t.accent)).join("")}
${featNodes.map((x, i) => node(x, featY, i + 1, lang)).join("")}
<circle cx="${mainNodes[3]}" cy="${mainY}" r="7" fill="${t.accent}" class="fx" style="animation:pop .45s cubic-bezier(.3,1.4,.5,1) 1.2s both"/>
<circle cx="${mainNodes[3]}" cy="${mainY}" r="7" stroke="${t.glow}" stroke-width="2" class="fx loop" style="animation:ping 1.8s ease-out 1.6s infinite"/>
<g class="in" style="animation-delay:1.4s">
  <rect x="${mainNodes[3] - 44}" y="${mainY + 20}" width="52" height="20" rx="10" fill="${t.accent}"/>
  <text x="${mainNodes[3] - 18}" y="${mainY + 34}" font-size="11" text-anchor="middle" class="b" fill="#fff">HEAD</text>
  <text x="40" y="${mainY + 34}" font-size="11" class="m">main</text>
  <text x="134" y="${featY - 18}" font-size="11" class="m">feat/*</text>
  <text x="${mainNodes[3] - 52}" y="${mainY - 16}" font-size="11" text-anchor="end" class="t b">${sha}</text>
</g>`;

    // last 30 days of activity as a sparkline
    const recent = ctx.d.days.slice(-30);
    const rMax = Math.max(1, ...recent.map((d) => d.count));
    const spark = recent
      .map((d, i) => {
        const bh = Math.max(2, (d.count / rMax) * 40);
        return `<rect x="${(560 + i * 8.4).toFixed(1)}" y="${(190 - bh).toFixed(1)}" width="5.4" height="${bh.toFixed(1)}" rx="2" fill="${d.count === rMax ? t.glow : d.count > 0 ? t.accent : t.subtle}" opacity="${d.count > 0 ? 1 : 0.6}" style="transform-box:fill-box;transform-origin:bottom;animation:grow .6s cubic-bezier(.2,.7,.2,1) ${(0.6 + i * 0.03).toFixed(2)}s both"/>`;
      })
      .join("");
    const css = `
@keyframes flow{to{stroke-dashoffset:-12}}
@keyframes ping{0%{transform:scale(1);opacity:1}100%{transform:scale(2.6);opacity:0}}
.prog{transform-box:fill-box;transform-origin:left;animation:growX 2.4s cubic-bezier(.2,.7,.2,1) .6s both}`;
    const lines = wrap(repo?.description || "No description yet — the code speaks for itself.", 46, 2);
    const created = repo?.createdAt ? new Date(repo.createdAt) : null;
    const pushed = repo?.pushedAt ? new Date(repo.pushedAt) : null;
    const span = created && pushed ? Math.max(1, (ctx.date.getTime() - created.getTime()) / 86400000) : 0;
    const prog = created && pushed ? Math.min(1, (pushed.getTime() - created.getTime()) / 86400000 / Math.max(span, 1)) : 0.5;
    const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
${graph}
${label(t, 300, 40, "now building")}
<text x="${W - 24}" y="40" font-size="12" text-anchor="end" class="m">${esc(repo?.pushedAt ? `last push ${ago(repo.pushedAt, ctx.date)}` : "")}</text>
<g class="in" style="animation-delay:.3s"><text x="300" y="86" font-size="30" class="t b">${esc(repo?.name ?? "—")}</text></g>
${lines.map((l, i) => `<g class="in" style="animation-delay:${(0.45 + i * 0.1).toFixed(2)}s"><text x="300" y="${114 + i * 19}" font-size="13" class="m">${esc(l)}</text></g>`).join("")}
<g class="in" style="animation-delay:.7s">
  ${repo?.language ? `<circle cx="305" cy="170" r="5" fill="${repo.language.color || t.accent}"/><text x="316" y="174.5" font-size="12" class="t">${esc(repo.language.name)}</text>` : ""}
  <text x="${repo?.language ? 316 + repo.language.name.length * 7.2 + 18 : 300}" y="174.5" font-size="12" class="m">★ ${repo?.stars ?? 0}</text>
</g>
${spark}
<text x="${W - 24}" y="146" font-size="10" text-anchor="end" class="m">last 30 days</text>
<rect x="300" y="196" width="${W - 324}" height="3" rx="1.5" fill="${t.raised}"/>
<rect class="prog" x="300" y="196" width="${((W - 324) * Math.max(0.04, prog)).toFixed(1)}" height="3" rx="1.5" fill="url(#accentGrad)"/>
<text x="300" y="216" font-size="10" class="m">${esc(created ? `created ${ago(repo!.createdAt, ctx.date)}` : "")}</text>
<text x="${W - 24}" y="216" font-size="10" text-anchor="end" class="m">now</text>`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, body });
  },
};
