import { esc } from "../lib/escape.js";
import { iconSvg, type IconName } from "../lib/icons.js";
import { svg } from "../lib/svg.js";
import type { Ctx, SvgWidget } from "./types.js";

const W = 200;
const H = 52;
const CYCLE = 9;

/**
 * Flat outlined link tile. Every few seconds a red block wipes through it,
 * inverting the type as it passes; tiles take turns.
 */
function tile(name: string, title: string, sub: string, ic: IconName | "globe", index: number, count: number): SvgWidget {
  return {
    kind: "svg",
    name: `social-${name}`,
    alt: title,
    render(ctx: Ctx) {
      const t = ctx.theme;
      const start = (index * CYCLE) / count;
      const icon = (color: string) =>
        ic === "globe"
          ? `<g stroke="${color}" stroke-width="1.6"><circle cx="26" cy="26" r="8"/><path d="M18 26h16M26 18c-4 5-4 11 0 16M26 18c4 5 4 11 0 16"/></g>`
          : iconSvg(ic, 18, 18, 16, color);
      const content = (fg: string, mut: string) => `${icon(fg)}
<text x="46" y="27" font-size="21" class="d" fill="${fg}" letter-spacing=".6">${esc(title.toUpperCase())}</text>
<text x="46" y="41" font-size="9.5" fill="${mut}">${esc(sub)}</text>
<path d="M172 32l10-10M174 22h8v8" stroke="${fg}" stroke-width="1.8" stroke-linecap="square"/>`;
      // wipe: rect slides in from the left, holds, exits to the right
      const kt = "0;0.04;0.12;0.2;1";
      const body = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="${t.paper}" stroke="${t.ink}" stroke-width="2"/>
${content(t.ink, t.muted)}
<clipPath id="wp"><rect y="0" height="${H}" x="0" width="0">
<animate attributeName="width" dur="${CYCLE}s" begin="${start.toFixed(2)}s" repeatCount="indefinite" keyTimes="${kt}" values="0;0;${W};${W};${W}" calcMode="spline" keySplines=".7 0 .2 1;.7 0 .2 1;.7 0 .2 1;0 0 1 1"/>
<animate attributeName="x" dur="${CYCLE}s" begin="${start.toFixed(2)}s" repeatCount="indefinite" keyTimes="${kt}" values="0;0;0;${W};${W}" calcMode="spline" keySplines=".7 0 .2 1;.7 0 .2 1;.7 0 .2 1;0 0 1 1"/>
</rect></clipPath>
<g clip-path="url(#wp)"><rect width="${W}" height="${H}" fill="${t.red}"/>${content(t.onRed, t.onRed)}</g>`;
      return svg({ width: W, height: H, theme: t, title, body, fonts: [400, "display"] });
    },
  };
}

const tiles: [string, string, string, IconName | "globe"][] = [
  ["linkedin", "LinkedIn", "niessen.dev/in", "linkedin"],
  ["instagram", "Instagram", "niessen.dev/ig", "instagram"],
  ["web", "Website", "niessen.dev", "globe"],
  ["github", "GitHub", "@DavidNiessen", "github"],
];

export const socials: SvgWidget[] = tiles.map(([n, title, sub, ic], i) => tile(n, title, sub, ic, i, tiles.length));
