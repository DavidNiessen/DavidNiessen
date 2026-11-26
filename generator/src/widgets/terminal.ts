import { age, daysAlive, daysUntilBirthday, monthName, pad2, parseBirthday, yearProgress } from "../lib/astro.js";
import { esc, groupDigits } from "../lib/escape.js";
import { svg } from "../lib/svg.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 840;
const FS = 14;
const LH = 22;
const ADV = FS * 0.6;
const X0 = 28;

type Seg = [text: string, cls: string];
interface Block {
  cmd: string;
  out: Seg[][];
}

function lineMarkup(segs: Seg[], x: number, y: number): string {
  return `<text x="${x}" y="${y}" font-size="${FS}" xml:space="preserve">${segs
    .map(([s, c]) => `<tspan class="${c}">${esc(s)}</tspan>`)
    .join("")}</text>`;
}

export const terminal: SvgWidget = {
  kind: "svg",
  name: "terminal",
  alt: "terminal: whoami, profile and uptime",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const b = parseBirthday(ctx.config.birthday);
    const yp = yearProgress(ctx.now);
    const untilBday = daysUntilBirthday(b, ctx.now);
    const bornStr = `${pad2(b.day)}.${pad2(b.month)}.${b.year}`;
    const k = "key";
    const s = "str";
    const n = "numc";
    const p = "m";
    const blocks: Block[] = [
      {
        cmd: "whoami",
        out: [[[`${ctx.config.name.toLowerCase()}`, "t b"], [" — software engineer @ ", "m"], [ctx.config.company, "a b"]]],
      },
      {
        cmd: "cat profile.json",
        out: [
          [["{ ", p], ['"age"', k], [": ", p], [String(age(b, ctx.now)), n], [", ", p], ['"born"', k], [": ", p], [`"${bornStr}"`, s], [", ", p], ['"based"', k], [": ", p], [`"${ctx.config.location.city}"`, s], [",", p]],
          [["  ", p], ['"focus"', k], [": [", p], ['"backend"', s], [", ", p], ['"cloud-native"', s], [", ", p], ['"devex"', s], ["], ", p], ['"coffee"', k], [": ", p], ["Infinity", n], [" }", p]],
        ],
      },
      {
        cmd: "uptime",
        out: [
          [
            ["up ", "m"], [groupDigits(daysAlive(b, ctx.now)), "numc b"], [" days", "m"], ["  ·  ", "s"],
            [untilBday === 0 ? "🎂 birthday today!" : `next level-up in ${untilBday} day${untilBday === 1 ? "" : "s"}`, "t"], ["  ·  ", "s"],
            [`${ctx.now.year} is ${(yp.fraction * 100).toFixed(1)}% done`, "m"],
          ],
        ],
      },
      {
        cmd: "ls ~/stack",
        out: [ctx.config.skills.flatMap((sk, i): Seg[] => [[sk, i % 3 === 0 ? "a" : "t"], ["  ", "m"]])],
      },
    ];

    // timeline
    const parts: string[] = [];
    let y = 70;
    let time = 0.6;
    const prompt: Seg[] = [["➜ ", "a b"], ["~ ", "dir b"]];
    const promptW = 4 * ADV;
    blocks.forEach((bl, bi) => {
      const typeDur = bl.cmd.length * 0.05;
      const id = `c${bi}`;
      const values = Array.from({ length: bl.cmd.length + 1 }, (_, c) => (c * ADV).toFixed(1)).join(";");
      parts.push(`<g class="fade" style="animation-delay:${time.toFixed(2)}s">${lineMarkup(prompt, X0, y)}</g>
<clipPath id="${id}"><rect x="${X0 + promptW}" y="${y - FS}" height="${LH}" width="0"><animate attributeName="width" begin="${(time + 0.15).toFixed(2)}s" dur="${typeDur.toFixed(2)}s" values="${values}" calcMode="discrete" fill="freeze"/></rect></clipPath>
<g clip-path="url(#${id})">${lineMarkup([[bl.cmd, "t"]], X0 + promptW, y)}</g>`);
      time += 0.15 + typeDur + 0.3;
      y += LH;
      bl.out.forEach((segs) => {
        parts.push(`<g class="in" style="animation-delay:${time.toFixed(2)}s">${lineMarkup(segs, X0, y)}</g>`);
        time += 0.12;
        y += LH;
      });
      time += 0.25;
      y += 8;
    });
    // final prompt with blinking cursor
    parts.push(`<g class="fade" style="animation-delay:${time.toFixed(2)}s">${lineMarkup(prompt, X0, y)}<rect x="${X0 + promptW + 2}" y="${y - FS + 1}" width="${ADV}" height="${FS + 3}" fill="${t.accent}" class="blink loop"/></g>`);
    const H = y + 50;
    const clock = `${pad2(ctx.now.hour)}:${pad2(ctx.now.minute)} ${pad2(ctx.now.day)}-${monthName(ctx.now.month)}-${String(ctx.now.year).slice(2)}`;
    const css = `.key{fill:${t.accent}}.str{fill:${t.name === "dark" ? "#d4d4d8" : "#3f3f46"}}.numc{fill:${t.glow}}.dir{fill:${t.muted}}
.bar{transform-box:fill-box;transform-origin:left;animation:growX 1s cubic-bezier(.2,.7,.2,1) .2s both}`;
    const body = `
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
<path d="M.5 12.5a12 12 0 0 1 12-12h${W - 25}a12 12 0 0 1 12 12V36H.5Z" fill="${t.raised}"/>
<path d="M.5 36H${W - 0.5}" stroke="${t.border}"/>
<circle cx="22" cy="18" r="6" fill="#ff5f57"/><circle cx="42" cy="18" r="6" fill="#febc2e"/><circle cx="62" cy="18" r="6" fill="#28c840"/>
<text x="${W / 2}" y="22.5" text-anchor="middle" font-size="12" class="m">${esc(`${ctx.config.login.toLowerCase()}@${ctx.config.location.city.toLowerCase()}: ~ — zsh`)}</text>
${parts.join("\n")}
<clipPath id="win"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12"/></clipPath>
<g clip-path="url(#win)">
  <rect x="1" y="${H - 28}" width="${W - 2}" height="27" fill="${t.raised}"/>
  <rect class="bar" x="1" y="${H - 28}" width="${W - 2}" height="1.5" fill="url(#accentGrad)"/>
  <rect x="1" y="${H - 26.5}" width="150" height="25.5" fill="${t.accent}"/>
  <text x="14" y="${H - 9.5}" font-size="12" class="b" fill="#fff">[profile] 0:zsh*</text>
  <text x="${W - 16}" y="${H - 9.5}" font-size="12" class="m" text-anchor="end">k8s:prod-eu-central-1  ·  git:main  ·  ${esc(clock)}</text>
</g>
<path d="M.5 ${H - 28}V${H - 12.5}a12 12 0 0 0 12 12h${W - 25}a12 12 0 0 0 12-12V${H - 28}" stroke="${t.border}"/>`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, body });
  },
};
