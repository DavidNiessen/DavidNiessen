import { readFileSync, readdirSync } from "node:fs";

/**
 * Brand icons live as plain SVG files in `assets/icons/`.
 * Single-colour icons declare their brand colour as the root `fill`
 * and are recoloured through `currentColor`; multi-colour icons
 * (root `fill="none"`) are embedded untouched.
 */
export interface Icon {
  inner: string;
  viewBox: string;
  color: string;
}

const dir = new URL("../../assets/icons/", import.meta.url);

function load(file: string): Icon {
  const raw = readFileSync(new URL(file, dir), "utf8").trim();
  const root = /^<svg([^>]*)>/.exec(raw)?.[1] ?? "";
  const viewBox = /viewBox="([^"]+)"/.exec(root)?.[1] ?? "0 0 24 24";
  const fill = /fill="([^"]+)"/.exec(root)?.[1] ?? "none";
  const body = raw.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  if (fill === "none") return { inner: body, viewBox, color: "#8b8b8f" };
  return { inner: body.replace(/<path /g, '<path fill="currentColor" '), viewBox, color: fill };
}

export const icons: Record<string, Icon> = Object.fromEntries(
  readdirSync(dir)
    .filter((f) => f.endsWith(".svg"))
    .map((f) => [f.replace(/\.svg$/, ""), load(f)]),
);

export type IconName =
  | "kotlin" | "java" | "spring" | "junit" | "aws" | "kubernetes" | "githubactions"
  | "mongodb" | "typescript" | "react" | "playwright" | "linkedin" | "instagram" | "github";

export function icon(name: IconName): Icon {
  const i = icons[name];
  if (!i) throw new Error(`unknown icon ${name}`);
  return i;
}

/** Render an icon as a nested <svg> at (x, y) with the given size; `fill` overrides the brand colour. */
export function iconSvg(name: IconName, x: number, y: number, size: number, fill?: string, extra = ""): string {
  const i = icon(name);
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${i.viewBox}" color="${fill ?? i.color}" ${extra}>${i.inner}</svg>`;
}
