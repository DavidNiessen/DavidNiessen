import { config } from "../config.js";
import { localParts } from "../lib/astro.js";
import type { ContributionDay, ProfileData } from "./types.js";

/** Small deterministic PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Realistic-looking calendar: weekday bias, bursts, quiet holidays. */
export function mockWeeks(now = new Date(), seed = 42): ContributionDay[][] {
  const r = rng(seed);
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 364 - end.getUTCDay());
  const weeks: ContributionDay[][] = [];
  let burst = 0;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const wd = d.getUTCDay();
    if (wd === 0) weeks.push([]);
    if (r() < 0.04) burst = 3 + Math.floor(r() * 6);
    const weekend = wd === 0 || wd === 6;
    const base = weekend ? 0.35 : 0.82;
    let count = r() < base ? Math.floor(r() * (weekend ? 5 : 9)) + 1 : 0;
    if (burst > 0) {
      count += 4 + Math.floor(r() * 10);
      burst--;
    }
    const month = d.getUTCMonth();
    if ((month === 7 && d.getUTCDate() > 10 && d.getUTCDate() < 22) || (month === 11 && d.getUTCDate() > 23)) count = 0;
    weeks[weeks.length - 1].push({ date: iso(d), count, level: 0, weekday: wd });
  }
  if (!weeks[0].length) weeks.shift();
  const max = Math.max(...weeks.flat().map((d) => d.count));
  for (const day of weeks.flat()) {
    day.level = (day.count === 0 ? 0 : Math.min(4, Math.ceil((day.count / max) * 4))) as ContributionDay["level"];
  }
  return weeks;
}

export function mockData(now = new Date()): ProfileData {
  const weeks = mockWeeks(now);
  const total = weeks.flat().reduce((a, d) => a + d.count, 0);
  const year = localParts(now).year;
  const hours = Array.from({ length: 24 }, (_, h) =>
    Math.round(40 * Math.exp(-((h - 15) ** 2) / 18) + 25 * Math.exp(-((h - 22) ** 2) / 6) + (h > 8 ? 4 : 1)),
  );
  const t = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();
  return {
    source: "mock",
    generatedAt: now.toISOString(),
    login: config.login,
    name: config.name,
    createdAt: "2020-06-30T10:00:00Z",
    followers: 64,
    following: 31,
    repoCount: 27,
    weeks,
    lastYearTotal: total,
    yearTotal: weeks.flat().filter((d) => d.date.startsWith(`${year}-`)).reduce((a, d) => a + d.count, 0),
    allTimeTotal: total * 3 + 412,
    totals: { commits: Math.round(total * 0.7), pullRequests: 186, issues: 42, reviews: 233, stars: 128, forks: 19, privateContributions: 940 },
    languages: [
      { name: "Kotlin", color: "#A97BFF", bytes: 1_840_000 },
      { name: "TypeScript", color: "#3178c6", bytes: 960_000 },
      { name: "Java", color: "#b07219", bytes: 610_000 },
      { name: "HCL", color: "#844FBA", bytes: 140_000 },
      { name: "Shell", color: "#89e051", bytes: 88_000 },
      { name: "Dockerfile", color: "#384d54", bytes: 21_000 },
      { name: "CSS", color: "#663399", bytes: 18_000 },
    ],
    projects: [
      { name: "ktor-starter", owner: config.login, description: "Opinionated Kotlin service template with Ktor, Koin and Testcontainers.", url: "https://github.com/DavidNiessen", stars: 48, forks: 7, language: { name: "Kotlin", color: "#A97BFF" } },
      { name: "kube-preview", owner: config.login, description: "Ephemeral preview environments on Kubernetes for every pull request.", url: "https://github.com/DavidNiessen", stars: 31, forks: 4, language: { name: "TypeScript", color: "#3178c6" } },
      { name: "spring-outbox", owner: config.login, description: "Transactional outbox pattern for Spring Boot and MongoDB.", url: "https://github.com/DavidNiessen", stars: 22, forks: 3, language: { name: "Java", color: "#b07219" } },
      { name: "e2e-lab", owner: config.login, description: "Playwright patterns for fast, flake-free end-to-end suites.", url: "https://github.com/DavidNiessen", stars: 15, forks: 2, language: { name: "TypeScript", color: "#3178c6" } },
    ],
    events: [
      { kind: "push", repo: "ktor-starter", detail: "3 commits → main", time: t(95) },
      { kind: "merge", repo: "kube-preview", detail: "PR #42 merged", time: t(260) },
      { kind: "review", repo: "spring-outbox", detail: "reviewed PR #17", time: t(410) },
      { kind: "release", repo: "ktor-starter", detail: "released v2.4.0", time: t(900) },
      { kind: "issue", repo: "e2e-lab", detail: "issue #9 opened", time: t(1500) },
      { kind: "create", repo: "infra-playground", detail: "created repository", time: t(2900) },
      { kind: "star", repo: "kotlinx.coroutines", detail: "starred", time: t(4100) },
    ],
    commitHours: hours,
    weather: { temperature: 3.4, min: -1.2, max: 5.8, code: 2, isDay: false, wind: 14 },
  };
}
