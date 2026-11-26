import { contrib } from "./contrib.js";
import { divider } from "./divider.js";
import { pulse } from "./pulse.js";
import { languages } from "./languages.js";
import { life } from "./life.js";
import { rhythm } from "./rhythm.js";
import { stack } from "./stack.js";
import { skyline } from "./skyline.js";
import { snake } from "./snake.js";
import { hero } from "./hero.js";
import { socials } from "./socials.js";
import { stats } from "./stats.js";
import { terminal } from "./terminal.js";
import type { Widget } from "./types.js";

export const widgets: Widget[] = [hero, ...socials, divider, terminal, stats, contrib, pulse, snake, skyline, life, stack, languages, rhythm];
