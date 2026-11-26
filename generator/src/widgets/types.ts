import type { Config } from "../config.js";
import type { Derived } from "../data/derive.js";
import type { ProfileData } from "../data/types.js";
import type { LocalDate } from "../lib/astro.js";
import type { Theme } from "../theme.js";

export interface Ctx {
  theme: Theme;
  data: ProfileData;
  d: Derived;
  /** wall-clock fields in the profile's time zone */
  now: LocalDate;
  date: Date;
  config: Config;
  /** GitHub Actions run number, when available */
  run: string | null;
}

export interface SvgWidget {
  kind: "svg";
  name: string;
  /** README alt text */
  alt: string;
  render(ctx: Ctx): string;
}

export interface GifWidget {
  kind: "gif";
  name: string;
  alt: string;
  render(ctx: Ctx): Buffer;
}

export type Widget = SvgWidget | GifWidget;
