import { divider } from "./divider.js";
import { hero } from "./hero.js";
import { socials } from "./socials.js";
import type { Widget } from "./types.js";

export const widgets: Widget[] = [hero, ...socials, divider];
