import { ago, esc, wrap } from "../lib/escape.js";
import { label, svg } from "../lib/svg.js";
import { rng } from "../data/mock.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 840;
const H = 230;

/** The most recently pushed repository, presented as the record on the deck. */
export const nowBuilding: SvgWidget = {
  kind: "svg",
  name: "now",
  alt: "now building",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const repo = ctx.data.repos.find((r) => r.name.toLowerCase() !== ctx.config.login.toLowerCase() && !r.name.startsWith(".")) ?? null;
    const cx = 132;
    const cy = 122;
    const R = 92;
    const grooves = Array.from({ length: 14 }, (_, i) => `<circle cx="${cx}" cy="${cy}" r="${(40 + i * 3.6).toFixed(1)}" stroke="#fff" stroke-opacity="${(0.03 + (i % 3) * 0.015).toFixed(3)}"/>`).join("");
    const initials = (repo?.name ?? "??").replace(/[^A-Za-z0-9]/g, " ").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const r = rng(7);
    const eq = Array.from({ length: 28 }, (_, i) => {
      const x = 560 + i * 9;
      const dur = (0.6 + r() * 0.9).toFixed(2);
      const lo = (0.15 + r() * 0.25).toFixed(2);
      return `<rect x="${x}" y="150" width="5" height="40" rx="2" fill="${i % 5 === 0 ? t.glow : t.accent}" opacity="${(0.55 + r() * 0.45).toFixed(2)}" class="loop" style="transform-box:fill-box;transform-origin:bottom;--lo:${lo};animation:eq ${dur}s ease-in-out ${(r() * -1).toFixed(2)}s infinite alternate"/>`;
    }).join("");
    const css = `
.disc{transform-origin:${cx}px ${cy}px;animation:spin 3.2s linear infinite}
.arm{transform-origin:262px 38px;animation:armIn 1.6s cubic-bezier(.2,.7,.2,1) .4s both}
@keyframes armIn{from{transform:rotate(-24deg)}to{transform:rotate(0)}}
@keyframes eq{from{transform:scaleY(var(--lo))}to{transform:scaleY(1)}}
.prog{transform-box:fill-box;transform-origin:left;animation:growX 2.4s cubic-bezier(.2,.7,.2,1) .6s both}`;
    const lines = wrap(repo?.description || "No description yet — the code speaks for itself.", 46, 2);
    const created = repo?.createdAt ? new Date(repo.createdAt) : null;
    const pushed = repo?.pushedAt ? new Date(repo.pushedAt) : null;
    const span = created && pushed ? Math.max(1, (ctx.date.getTime() - created.getTime()) / 86400000) : 0;
    const prog = created && pushed ? Math.min(1, (pushed.getTime() - created.getTime()) / 86400000 / Math.max(span, 1)) : 0.5;
    const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
<g class="disc loop">
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="#0b0b0c" stroke="${t.border}"/>
  ${grooves}
  <circle cx="${cx}" cy="${cy}" r="32" fill="${t.accent}"/>
  <circle cx="${cx}" cy="${cy}" r="32" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="4"/>
  <text x="${cx}" y="${cy + 6}" font-size="17" text-anchor="middle" class="b" fill="#fff">${esc(initials)}</text>
  <text x="${cx}" y="${cy - 14}" font-size="6.5" text-anchor="middle" fill="#fff" opacity=".8" letter-spacing="1">SIDE A</text>
  <circle cx="${cx}" cy="${cy}" r="3" fill="${t.card}"/>
</g>
<path d="M${cx - R + 14} ${cy - 30}A${R - 10} ${R - 10} 0 0 1 ${cx - 30} ${cy - R + 14}" stroke="#fff" stroke-opacity=".12" stroke-width="10" stroke-linecap="round"/>
<g class="arm">
  <circle cx="262" cy="38" r="12" fill="${t.raised}" stroke="${t.border}"/>
  <circle cx="262" cy="38" r="4" fill="${t.muted}"/>
  <path d="M262 38L246 128L222 150" stroke="${t.muted}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="210" y="144" width="18" height="10" rx="2" transform="rotate(42 219 149)" fill="${t.text}"/>
</g>

${label(t, 300, 40, "now building")}
<text x="${W - 24}" y="40" font-size="12" text-anchor="end" class="m">${esc(repo?.pushedAt ? `last push ${ago(repo.pushedAt, ctx.date)}` : "")}</text>
<g class="in" style="animation-delay:.3s"><text x="300" y="86" font-size="30" class="t b">${esc(repo?.name ?? "—")}</text></g>
${lines.map((l, i) => `<g class="in" style="animation-delay:${(0.45 + i * 0.1).toFixed(2)}s"><text x="300" y="${114 + i * 19}" font-size="13" class="m">${esc(l)}</text></g>`).join("")}
<g class="in" style="animation-delay:.7s">
  ${repo?.language ? `<circle cx="305" cy="170" r="5" fill="${repo.language.color || t.accent}"/><text x="316" y="174.5" font-size="12" class="t">${esc(repo.language.name)}</text>` : ""}
  <text x="${repo?.language ? 316 + repo.language.name.length * 7.2 + 18 : 300}" y="174.5" font-size="12" class="m">★ ${repo?.stars ?? 0}</text>
</g>
${eq}
<rect x="300" y="196" width="${W - 324}" height="3" rx="1.5" fill="${t.raised}"/>
<rect class="prog" x="300" y="196" width="${((W - 324) * Math.max(0.04, prog)).toFixed(1)}" height="3" rx="1.5" fill="url(#accentGrad)"/>
<text x="300" y="216" font-size="10" class="m">${esc(created ? `created ${ago(repo!.createdAt, ctx.date)}` : "")}</text>
<text x="${W - 24}" y="216" font-size="10" text-anchor="end" class="m">now</text>`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, body });
  },
};
