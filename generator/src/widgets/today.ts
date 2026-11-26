import { moonPhase, yearProgress } from "../lib/astro.js";
import { esc, num, wrap } from "../lib/escape.js";
import { label, svg } from "../lib/svg.js";
import { weatherKind, weatherLabel, type WeatherKind } from "../data/weather.js";
import { moonGlyph } from "./parts.js";
import type { Theme } from "../theme.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 410;
const H = 300;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function weatherIcon(t: Theme, kind: WeatherKind, x: number, y: number, isDay: boolean): string {
  const sun = isDay
    ? `<g class="loop" style="transform-origin:${x}px ${y}px;animation:spin 12s linear infinite">${Array.from({ length: 8 }, (_, i) => `<line x1="${x}" y1="${y - 15}" x2="${x}" y2="${y - 19}" stroke="${t.glow}" stroke-width="2" stroke-linecap="round" transform="rotate(${i * 45} ${x} ${y})"/>`).join("")}</g><circle cx="${x}" cy="${y}" r="10" fill="${t.glow}"/>`
    : `<path d="M${x + 6} ${y - 12}a12 12 0 1 0 8 18a9.5 9.5 0 0 1-8-18z" fill="${t.text}"/>`;
  const cloud = (cx: number, cy: number, fill: string) =>
    `<g class="loop" style="animation:drift 6s ease-in-out infinite alternate"><path d="M${cx - 16} ${cy + 8}h30a8 8 0 0 0 0-16a11 11 0 0 0-21-3a8 8 0 0 0-9 19z" fill="${fill}"/></g>`;
  const drops = (n: number, snow: boolean) =>
    Array.from({ length: n }, (_, i) => {
      const dx = x - 10 + i * 8;
      return snow
        ? `<circle cx="${dx}" cy="${y + 16}" r="1.8" fill="${t.text}" class="loop" style="animation:fall 1.8s linear ${(i * 0.4).toFixed(1)}s infinite"/>`
        : `<line x1="${dx}" y1="${y + 12}" x2="${dx - 2}" y2="${y + 18}" stroke="${t.accent}" stroke-width="1.6" stroke-linecap="round" class="loop" style="animation:fall .9s linear ${(i * 0.25).toFixed(2)}s infinite"/>`;
    }).join("");
  switch (kind) {
    case "clear":
      return sun;
    case "partly":
      return `<g transform="translate(-6 -6)">${sun}</g>${cloud(x + 4, y + 4, t.muted)}`;
    case "cloudy":
    case "fog":
      return `${cloud(x - 4, y - 2, t.subtle)}${cloud(x + 4, y + 4, t.muted)}`;
    case "drizzle":
    case "rain":
      return `${cloud(x, y - 2, t.muted)}${drops(kind === "rain" ? 4 : 2, false)}`;
    case "snow":
      return `${cloud(x, y - 2, t.muted)}${drops(4, true)}`;
    case "storm":
      return `${cloud(x, y - 2, t.muted)}<path d="M${x + 1} ${y + 6}l-5 9h5l-3 8 9-11h-5l3-6z" fill="${t.glow}" class="loop" style="animation:pulse 1.2s steps(2) infinite"/>`;
  }
}

export const today: SvgWidget = {
  kind: "svg",
  name: "today",
  alt: "today: date, moon, weather and quote",
  render(ctx: Ctx) {
    const t = ctx.theme;
    const n = ctx.now;
    const moon = moonPhase(ctx.date);
    const yp = yearProgress(n);
    const quotes = ctx.config.quotes;
    const [quote, author] = quotes[(yp.dayOfYear + n.year) % quotes.length];
    const lines = wrap(`“${quote}”`, 44, 2);
    const w = ctx.data.weather;
    const kind = w ? weatherKind(w.code) : null;
    const css = `@keyframes drift{from{transform:translateX(-3px)}to{transform:translateX(3px)}}
@keyframes fall{from{transform:translateY(-4px);opacity:1}to{transform:translateY(8px);opacity:0}}
.yp{transform-box:fill-box;transform-origin:left;animation:growX 1.6s cubic-bezier(.2,.7,.2,1) .6s both}`;
    const body = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.card}" stroke="${t.border}"/>
${label(t, 24, 30, `today · ${ctx.config.location.city}`)}
<g class="in" style="animation-delay:.15s">
<text x="22" y="112" font-size="72" class="t b" letter-spacing="-3">${String(n.day).padStart(2, "0")}</text>
<text x="124" y="78" font-size="15" class="a b">${MONTHS[n.month - 1]} ${n.year}</text>
<text x="124" y="98" font-size="11" class="m" letter-spacing="1">${DAYS[n.weekday]}</text>
<text x="124" y="114" font-size="11" class="m">day ${yp.dayOfYear} · wk ${Math.ceil(yp.dayOfYear / 7)}</text>
</g>
<g class="in" style="animation-delay:.35s">
${moonGlyph(t, 300, 86, 22, moon.phase)}
<text x="334" y="82" font-size="11" class="t b">${num(moon.illumination * 100, 0)}%</text>
<text x="334" y="97" font-size="9.5" class="m">${esc(moon.name.toLowerCase().split(" ").slice(-1)[0])}</text>
</g>
<path d="M24 136H${W - 24}" stroke="${t.border}"/>
${
  w && kind
    ? `<g class="in" style="animation-delay:.5s">${weatherIcon(t, kind, 46, 172, w.isDay)}
<text x="80" y="170" font-size="26" class="t b">${num(w.temperature, 1)}°</text>
<text x="80" y="189" font-size="10.5" class="m">${esc(weatherLabel(kind))}</text>
<text x="${W - 24}" y="166" font-size="11" text-anchor="end" class="m">↑ ${Math.round(w.max)}°  ↓ ${Math.round(w.min)}°</text>
<text x="${W - 24}" y="184" font-size="11" text-anchor="end" class="m">wind ${Math.round(w.wind)} km/h</text></g>`
    : `<g class="in" style="animation-delay:.5s"><text x="24" y="176" font-size="12" class="m">${esc(`${n.year} is ${num(yp.fraction * 100, 1)}% done — make it count.`)}</text></g>`
}
<rect x="24" y="206" width="${W - 48}" height="4" rx="2" fill="${t.raised}"/>
<rect class="yp" x="24" y="206" width="${((W - 48) * yp.fraction).toFixed(1)}" height="4" rx="2" fill="url(#accentGrad)"/>
<path d="M24 226H${W - 24}" stroke="${t.border}" stroke-dasharray="2 4"/>
${lines.map((l, i) => `<text x="24" y="${250 + i * 17}" font-size="11.5" class="t fade" style="animation-delay:${(0.9 + i * 0.15).toFixed(2)}s">${esc(l)}</text>`).join("")}
<text x="${W - 24}" y="${H - 14}" font-size="10" text-anchor="end" class="a fade" style="animation-delay:1.3s">— ${esc(author)}</text>`;
    return svg({ width: W, height: H, theme: t, title: this.alt, css, body });
  },
};
