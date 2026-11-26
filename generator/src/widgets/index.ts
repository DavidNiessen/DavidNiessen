import { contrib } from "./contrib.js";
import { divider } from "./divider.js";
import { pulse } from "./pulse.js";
import { hero } from "./hero.js";
import { socials } from "./socials.js";
import { stats } from "./stats.js";
import { terminal } from "./terminal.js";
import type { Widget } from "./types.js";

export const widgets: Widget[] = [hero, ...socials, divider, terminal, stats, contrib, pulse];
