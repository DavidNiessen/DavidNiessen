import type { RepoSummary } from "../types.js";

const L = {
  java: { name: "Java", color: "#b07219" },
  kotlin: { name: "Kotlin", color: "#A97BFF" },
  ts: { name: "TypeScript", color: "#3178c6" },
  js: { name: "JavaScript", color: "#f1e05a" },
  py: { name: "Python", color: "#3572A5" },
  cpp: { name: "C++", color: "#f34b7d" },
};

const r = (name: string, description: string, language: RepoSummary["language"], stars: number, createdAt: string, pushedAt: string): RepoSummary => ({
  name,
  description,
  url: `https://github.com/DavidNiessen/${name}`,
  stars,
  language,
  createdAt,
  pushedAt,
});

/** Offline fixture modelled on the public repositories, used for --mock builds and tests. */
export const fixtureRepos: RepoSummary[] = [
  r("soundwave", "Turn any song into a rhythm game: stems, auto-charted difficulties and a live 3D crowd.", L.ts, 3, "2026-09-12T10:00:00Z", "2026-11-25T16:26:22Z"),
  r("portfolio", "Animated private cyberpunk portfolio website", L.js, 0, "2026-10-02T10:00:00Z", "2026-11-18T12:43:41Z"),
  r("undusted", "An incremental cleaning game about undusting a universe of miniature planets (Godot 4 + Blender)", L.py, 0, "2026-10-20T10:00:00Z", "2026-11-15T20:55:04Z"),
  r("gatebreaker", "CLI and chrome extension for bypassing download gates", L.ts, 0, "2026-10-28T10:00:00Z", "2026-11-15T10:25:47Z"),
  r("afterlight-studio", "Audio-reactive stage lighting studio with a 3D editor and automatic choreography.", L.ts, 0, "2026-08-30T10:00:00Z", "2026-11-14T20:43:02Z"),
  r("lexicon-mcp", "Local MCP Server for LexiconDJ", L.ts, 3, "2026-07-01T10:00:00Z", "2026-11-06T00:16:14Z"),
  r("syrup", "Independent open-source synthesizer: Serum preset compatibility research and implementation", L.cpp, 0, "2026-10-10T10:00:00Z", "2026-11-04T13:15:17Z"),
  r("doctopus", "An open-source home for your API docs, guides, and playground", L.ts, 0, "2026-09-20T10:00:00Z", "2026-10-30T17:05:48Z"),
  r("flac-classifier", "Classifies FLAC files as genuine hi-res, CD quality, or lossy transcodes.", L.kotlin, 0, "2026-08-20T10:00:00Z", "2026-09-03T16:36:34Z"),
  r("pace-webhook-service", "Scrapes the Axel Springer canteen menu and dispatches it to webhooks.", L.kotlin, 0, "2025-09-01T10:00:00Z", "2025-10-08T09:31:14Z"),
  r("disruption-notifier", "Scrapes S-Bahn Berlin disruption data and writes it to a webhook", L.kotlin, 1, "2025-04-10T10:00:00Z", "2025-05-02T09:38:10Z"),
  r("AdventOfCode", "", L.kotlin, 0, "2024-12-01T10:00:00Z", "2024-12-03T12:35:33Z"),
  r("spring-course", "", L.java, 0, "2024-10-01T10:00:00Z", "2024-11-25T13:29:51Z"),
  r("skill-theme", "A unique dark theme for IntelliJ-based IDEs", null, 1, "2023-09-01T10:00:00Z", "2023-09-15T19:22:55Z"),
  r("AdvancedMLGRush", "The most advanced MLGRush minigame plugin for Minecraft servers. 100% customisable.", L.java, 5, "2023-03-01T10:00:00Z", "2023-08-22T16:00:51Z"),
  r("gtb-solver", "A solver for the Hypixel minigame \"Guess The Build\"", L.java, 4, "2023-06-01T10:00:00Z", "2023-08-10T21:06:38Z"),
  r("SimpleGuicePlugin", "An example for dependency injection (Google Guice) in a Spigot plugin", L.java, 2, "2022-10-01T10:00:00Z", "2022-10-27T21:30:57Z"),
  r("Log4ShellFix", "A simple but effective fix for the Log4Shell exploit.", L.java, 0, "2021-12-12T10:00:00Z", "2022-01-16T14:44:43Z"),
  r("KotlinJsonConfigAPI", "A simple Json config API for Kotlin", L.kotlin, 1, "2021-07-20T10:00:00Z", "2021-07-25T19:19:48Z"),
  r("Hyperion", "Experience the best Hypixel SkyBlock sword on your own server!", L.java, 3, "2021-05-01T10:00:00Z", "2021-06-19T15:01:04Z"),
];
