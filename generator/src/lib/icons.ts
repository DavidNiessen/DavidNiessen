import { readFileSync } from "node:fs";
import * as si from "simple-icons";
import { faAws, faInstagram, faJava, faLinkedinIn } from "@fortawesome/free-brands-svg-icons";

export interface Icon {
  /** inner SVG markup (paths); uses `currentColor` unless multi-coloured */
  inner: string;
  viewBox: string;
  /** official brand colour */
  color: string;
}

type SimpleIcon = { path: string; hex: string };
type FaIcon = { icon: [number, number, unknown, unknown, string | string[]] };

function fromSimple(icon: SimpleIcon, color?: string): Icon {
  return { inner: `<path d="${icon.path}" fill="currentColor"/>`, viewBox: "0 0 24 24", color: color ?? `#${icon.hex}` };
}

function fromFa(icon: FaIcon, color: string): Icon {
  const [w, h, , , d] = icon.icon;
  const paths = Array.isArray(d) ? d : [d];
  return { inner: paths.map((p) => `<path d="${p}" fill="currentColor"/>`).join(""), viewBox: `0 0 ${w} ${h}`, color };
}

function playwright(): Icon {
  const raw = readFileSync(new URL("../../assets/playwright.svg", import.meta.url), "utf8");
  const inner = raw.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return { inner, viewBox: "0 0 24 24", color: "#2EAD33" };
}

const s = si as unknown as Record<string, SimpleIcon>;

export const icons = {
  kotlin: fromSimple(s.siKotlin),
  java: fromFa(faJava as unknown as FaIcon, "#f89820"),
  spring: fromSimple(s.siSpring),
  junit: fromSimple(s.siJunit5),
  aws: fromFa(faAws as unknown as FaIcon, "#ff9900"),
  kubernetes: fromSimple(s.siKubernetes),
  githubactions: fromSimple(s.siGithubactions),
  mongodb: fromSimple(s.siMongodb),
  typescript: fromSimple(s.siTypescript),
  react: fromSimple(s.siReact),
  playwright: playwright(),
  linkedin: fromFa(faLinkedinIn as unknown as FaIcon, "#0a66c2"),
  instagram: fromSimple(s.siInstagram, "#e1306c"),
  github: fromSimple(s.siGithub),
} satisfies Record<string, Icon>;

export type IconName = keyof typeof icons;

/** Render an icon as a nested <svg> at (x, y) with the given size; `fill` sets currentColor. */
export function iconSvg(name: IconName, x: number, y: number, size: number, fill?: string, extra = ""): string {
  const i = icons[name];
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${i.viewBox}" color="${fill ?? i.color}" ${extra}>${i.inner}</svg>`;
}
