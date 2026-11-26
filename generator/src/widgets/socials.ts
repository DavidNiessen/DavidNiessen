import { esc } from "../lib/escape.js";
import { iconSvg, type IconName } from "../lib/icons.js";
import { svg } from "../lib/svg.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 200;
const H = 52;

function pill(name: string, title: string, sub: string, ic: IconName | "globe", index: number): SvgWidget {
  return {
    kind: "svg",
    name: `social-${name}`,
    alt: title,
    render(ctx: Ctx) {
      const t = ctx.theme;
      const perim = 2 * (W - 2 + H - 2);
      const d0 = index * 0.25;
      const css = `
.run{stroke-dasharray:60 ${perim - 60};animation:runB 4s linear ${index * -1.3}s infinite}
@keyframes runB{to{stroke-dashoffset:-${perim}}}
.sh{animation:shimmer 4.5s ease-in-out ${1 + index * 0.6}s infinite}
.bob{transform-box:fill-box;transform-origin:center;animation:ibob 3s ease-in-out ${index * 0.4}s infinite}
@keyframes ibob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2px) rotate(-6deg)}}
.arrow{animation:arr 2.2s ease-in-out infinite}
@keyframes arr{0%,100%{transform:translate(0,0)}50%{transform:translate(2px,-2px)}}`;
      const iconMarkup =
        ic === "globe"
          ? `<g stroke="${t.accent}" stroke-width="1.6" fill="none"><circle cx="34" cy="26" r="9"/><ellipse cx="34" cy="26" rx="4" ry="9"/><path d="M25 26h18M27 21h14M27 31h14"/></g>`
          : iconSvg(ic, 25, 17, 18, ic === "github" ? t.text : t.accent);
      const body = `
<clipPath id="pc"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14"/></clipPath>
<g class="in" style="animation-delay:${d0}s">
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="${t.card}" stroke="${t.border}"/>
<rect class="run loop" x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" stroke="url(#accentGrad)" stroke-width="1.5" stroke-linecap="round"/>
<g clip-path="url(#pc)"><rect class="sh loop" x="0" y="0" width="80" height="${H}" fill="url(#shine)" transform="skewX(-20)"/></g>
<rect x="12" y="10" width="44" height="32" rx="9" fill="${t.raised}" stroke="${t.border}"/>
<g class="bob loop">${iconMarkup}</g>
<text x="66" y="24" font-size="13.5" class="t b">${esc(title)}</text>
<text x="66" y="39" font-size="10.5" class="m">${esc(sub)}</text>
<g class="arrow loop"><path d="M176 30l8-8M178 22h6v6" stroke="${t.muted}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g>
</g>`;
      return svg({ width: W, height: H, theme: t, title, css, body });
    },
  };
}

export const socials: SvgWidget[] = [
  pill("linkedin", "LinkedIn", "niessen.dev/in", "linkedin", 0),
  pill("instagram", "Instagram", "niessen.dev/ig", "instagram", 1),
  pill("web", "Website", "niessen.dev", "globe", 2),
  pill("github", "GitHub", "@DavidNiessen", "github", 3),
];
