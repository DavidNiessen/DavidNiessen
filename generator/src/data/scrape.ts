import { config } from "../config.js";
import { fetchEvents, sumYear } from "./github.js";
import { fetchWithTimeout, ghGet, soft } from "./http.js";
import type { ContributionDay, ProfileData, Repo } from "./types.js";
import { localParts } from "../lib/astro.js";

/**
 * Parse the public contributions calendar HTML (github.com/users/<login>/contributions).
 * Cells look like `<td data-date="2025-11-23" id="contribution-day-component-0-0" data-level="0">`
 * and counts live in `<tool-tip for="contribution-day-component-0-0">3 contributions on …</tool-tip>`.
 */
export function parseContributionsHtml(html: string): ContributionDay[][] {
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = /^(\d[\d,]*)\s+contribution/.exec(m[2].trim());
    counts.set(m[1], n ? Number(n[1].replace(/,/g, "")) : 0);
  }
  const days: ContributionDay[] = [];
  for (const m of html.matchAll(/<td\b[^>]*class="ContributionCalendar-day"[^>]*>/g)) {
    const tag = m[0];
    const date = /data-date="([\d-]+)"/.exec(tag)?.[1];
    const id = /id="([^"]+)"/.exec(tag)?.[1];
    const level = Number(/data-level="(\d)"/.exec(tag)?.[1] ?? 0) as ContributionDay["level"];
    if (!date) continue;
    const count = (id ? counts.get(id) : undefined) ?? (level > 0 ? level : 0);
    days.push({ date, count, level, weekday: new Date(`${date}T12:00:00Z`).getUTCDay() });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  const weeks: ContributionDay[][] = [];
  for (const d of days) {
    if (!weeks.length || d.weekday === 0) weeks.push([]);
    weeks[weeks.length - 1].push(d);
  }
  return weeks;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function countOf(s: string | undefined): number {
  if (!s) return 0;
  const t = s.trim().toLowerCase().replace(/,/g, "");
  return t.endsWith("k") ? Math.round(parseFloat(t) * 1000) : Number(t) || 0;
}

/** Parse the pinned repositories from a GitHub profile page. */
export function parsePinnedHtml(html: string): Repo[] {
  const items = html.split(/class="pinned-item-list-item-content"/).slice(1);
  return items.flatMap((chunk): Repo[] => {
    const s = chunk.slice(0, chunk.indexOf("</li>") >= 0 ? chunk.indexOf("</li>") : undefined);
    const href = /href="\/([^/"]+)\/([^/"]+)"/.exec(s);
    if (!href || />\s*Private\s*</.test(s)) return [];
    const desc = /class="pinned-item-desc[^"]*"[^>]*>([\s\S]*?)<\/p>/.exec(s)?.[1] ?? "";
    const lang = /itemprop="programmingLanguage">([^<]+)</.exec(s)?.[1];
    const color = /repo-language-color" style="background-color: ([^;"]+)/.exec(s)?.[1] ?? "";
    const stars = /\/stargazers"[\s\S]*?<\/svg>\s*([\d.,k]+)/.exec(s)?.[1];
    const forks = /\/forks"[\s\S]*?<\/svg>\s*([\d.,k]+)/.exec(s)?.[1];
    return [
      {
        owner: href[1],
        name: href[2],
        url: `https://github.com/${href[1]}/${href[2]}`,
        description: decodeEntities(desc.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()),
        stars: countOf(stars),
        forks: countOf(forks),
        language: lang ? { name: lang.trim(), color } : null,
      },
    ];
  });
}

/** Pinned repositories from the public profile page (no API needed). */
export async function fetchPinned(login = config.login): Promise<Repo[]> {
  const res = await fetchWithTimeout(`https://github.com/${login}`, { headers: { accept: "text/html" } });
  if (!res.ok) throw new Error(`profile page → ${res.status}`);
  return parsePinnedHtml(await res.text());
}

/** Token-less fallback: scrape the calendar and use the unauthenticated REST API for the rest. */
export async function fetchScraped(login = config.login): Promise<Omit<ProfileData, "weather" | "generatedAt">> {
  const res = await fetchWithTimeout(`https://github.com/users/${login}/contributions`, { headers: { accept: "text/html" } });
  if (!res.ok) throw new Error(`contributions page → ${res.status}`);
  const weeks = parseContributionsHtml(await res.text());
  if (!weeks.length) throw new Error("contributions page had no calendar cells");
  const user = await soft(
    "rest user",
    () => ghGet<{ name: string | null; created_at: string; followers: number; following: number; public_repos: number }>(`https://api.github.com/users/${login}`),
    null,
  );
  const repos = await soft(
    "rest repos",
    () =>
      ghGet<{ name: string; owner: { login: string }; description: string | null; html_url: string; stargazers_count: number; forks_count: number; fork: boolean; private?: boolean; language: string | null; created_at: string; pushed_at: string }[]>(`https://api.github.com/users/${login}/repos?type=owner&per_page=100&sort=pushed`),
    null,
  );
  // privacy guard: public, non-fork repositories only
  const own = (repos ?? []).filter((r) => !r.fork && r.private !== true);
  const pinned = (await soft("pinned", () => fetchPinned(login), [])).filter((r) => r.name.toLowerCase() !== login.toLowerCase());
  const total = weeks.flat().reduce((a, d) => a + d.count, 0);
  const langCount = new Map<string, number>();
  own.forEach((r) => r.language && langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1));
  return {
    source: "scrape",
    login,
    name: user?.name || config.name,
    createdAt: user?.created_at ?? null,
    followers: user?.followers ?? 0,
    following: user?.following ?? 0,
    repoCount: user?.public_repos ?? own.length,
    weeks,
    lastYearTotal: total,
    yearTotal: sumYear(weeks, localParts(new Date()).year),
    allTimeTotal: total,
    totals: {
      commits: null,
      pullRequests: null,
      issues: null,
      reviews: null,
      stars: repos ? own.reduce((a, r) => a + r.stargazers_count, 0) : null,
      forks: repos ? own.reduce((a, r) => a + r.forks_count, 0) : null,
      privateContributions: null,
    },
    languages: [...langCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => ({ name, color: "", bytes: n })),
    projects: pinned.length
      ? pinned
      : own
      .filter((r) => r.name !== login)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6)
      .map((r) => ({
        name: r.name,
        owner: r.owner.login,
        description: r.description ?? "",
        url: r.html_url,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language ? { name: r.language, color: "" } : null,
      })),
    repos: own.map((r) => ({
      name: r.name,
      description: r.description ?? "",
      url: r.html_url,
      stars: r.stargazers_count,
      language: r.language ? { name: r.language, color: "" } : null,
      createdAt: r.created_at,
      pushedAt: r.pushed_at,
    })),
    yearTotals: { [localParts(new Date()).year]: sumYear(weeks, localParts(new Date()).year) },
    events: await soft("events", () => fetchEvents(login), []),
    commitHours: null,
  };
}
