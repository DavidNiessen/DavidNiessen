import { config } from "../config.js";
import { localParts } from "../lib/astro.js";
import { getJson, githubHeaders, graphql, soft } from "./http.js";
import type { ActivityEvent, ContributionDay, LanguageShare, ProfileData, Repo } from "./types.js";

const LEVELS: Record<string, ContributionDay["level"]> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

interface GqlRepo {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  isArchived?: boolean;
  pushedAt?: string;
  owner: { login: string };
  primaryLanguage: { name: string; color: string | null } | null;
  languages?: { edges: { size: number; node: { name: string; color: string | null } }[] };
}

interface MainQuery {
  user: {
    name: string | null;
    login: string;
    createdAt: string;
    followers: { totalCount: number };
    following: { totalCount: number };
    pullRequests: { totalCount: number };
    issues: { totalCount: number };
    contributionsCollection: {
      contributionYears: number[];
      totalCommitContributions: number;
      totalPullRequestReviewContributions: number;
      restrictedContributionsCount: number;
      contributionCalendar: {
        totalContributions: number;
        weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string; weekday: number }[] }[];
      };
    };
    repositories: { totalCount: number; nodes: GqlRepo[] };
    pinnedItems: { nodes: GqlRepo[] };
  };
}

const REPO_FIELDS = `name description url stargazerCount forkCount isArchived pushedAt owner{login} primaryLanguage{name color}`;

const MAIN_QUERY = `query($login:String!){
  user(login:$login){
    name login createdAt
    followers{totalCount} following{totalCount}
    pullRequests{totalCount} issues{totalCount}
    contributionsCollection{
      contributionYears totalCommitContributions totalPullRequestReviewContributions restrictedContributionsCount
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount contributionLevel weekday } } }
    }
    repositories(first:100, ownerAffiliations:OWNER, isFork:false, orderBy:{field:PUSHED_AT, direction:DESC}){
      totalCount
      nodes{ ${REPO_FIELDS} languages(first:10, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name color } } } }
    }
    pinnedItems(first:4, types:REPOSITORY){ nodes{ ... on Repository { ${REPO_FIELDS} } } }
  }
}`;

function toRepo(r: GqlRepo): Repo {
  return {
    name: r.name,
    owner: r.owner.login,
    description: r.description ?? "",
    url: r.url,
    stars: r.stargazerCount,
    forks: r.forkCount,
    language: r.primaryLanguage ? { name: r.primaryLanguage.name, color: r.primaryLanguage.color ?? "#8b8b8f" } : null,
  };
}

async function yearTotals(login: string, years: number[]): Promise<Record<number, number>> {
  if (!years.length) return {};
  const parts = years.map(
    (y) => `y${y}: contributionsCollection(from:"${y}-01-01T00:00:00Z", to:"${y}-12-31T23:59:59Z"){ contributionCalendar{ totalContributions } }`,
  );
  const data = await graphql<{ user: Record<string, { contributionCalendar: { totalContributions: number } }> }>(
    `query($login:String!){ user(login:$login){ ${parts.join("\n")} } }`,
    { login },
  );
  return Object.fromEntries(years.map((y) => [y, data.user[`y${y}`].contributionCalendar.totalContributions]));
}

interface RestEvent {
  type: string;
  repo: { name: string };
  created_at: string;
  payload: {
    action?: string;
    ref?: string;
    ref_type?: string;
    size?: number;
    commits?: unknown[];
    pull_request?: { number: number; merged?: boolean };
    issue?: { number: number };
    release?: { tag_name: string };
  };
}

export function mapEvent(e: RestEvent): ActivityEvent | null {
  const repo = e.repo.name.split("/")[1] ?? e.repo.name;
  const time = e.created_at;
  const p = e.payload;
  switch (e.type) {
    case "PushEvent": {
      const n = p.size ?? p.commits?.length ?? 1;
      const branch = (p.ref ?? "").replace("refs/heads/", "") || "main";
      return { kind: "push", repo, detail: `${n} commit${n === 1 ? "" : "s"} → ${branch}`, time };
    }
    case "PullRequestEvent": {
      const n = p.pull_request?.number ?? 0;
      if (p.action === "closed" && p.pull_request?.merged) return { kind: "merge", repo, detail: `PR #${n} merged`, time };
      return { kind: "pr", repo, detail: `PR #${n} ${p.action ?? "updated"}`, time };
    }
    case "PullRequestReviewEvent":
      return { kind: "review", repo, detail: `reviewed PR #${p.pull_request?.number ?? 0}`, time };
    case "IssuesEvent":
      return { kind: "issue", repo, detail: `issue #${p.issue?.number ?? 0} ${p.action ?? ""}`.trim(), time };
    case "ReleaseEvent":
      return { kind: "release", repo, detail: `released ${p.release?.tag_name ?? ""}`.trim(), time };
    case "CreateEvent":
      return { kind: "create", repo, detail: `created ${p.ref_type ?? "repo"}${p.ref ? ` ${p.ref}` : ""}`, time };
    case "WatchEvent":
      return { kind: "star", repo, detail: "starred", time };
    case "ForkEvent":
      return { kind: "fork", repo, detail: "forked", time };
    default:
      return null;
  }
}

export async function fetchEvents(login: string): Promise<ActivityEvent[]> {
  const raw = await getJson<RestEvent[]>(`https://api.github.com/users/${login}/events/public?per_page=50`, githubHeaders());
  return raw.map(mapEvent).filter((e): e is ActivityEvent => e !== null).slice(0, 8);
}

/** Commit counts per local hour, sampled from the most recently pushed repositories. */
export async function fetchCommitHours(login: string, repos: { owner: string; name: string }[]): Promise<number[] | null> {
  const hours = new Array(24).fill(0);
  const since = new Date(Date.now() - 365 * 86_400_000).toISOString();
  let total = 0;
  for (const r of repos.slice(0, 8)) {
    const commits = await soft(
      `commits ${r.name}`,
      () =>
        getJson<{ commit: { author: { date: string } } }[]>(
          `https://api.github.com/repos/${r.owner}/${r.name}/commits?author=${login}&since=${since}&per_page=100`,
          githubHeaders(),
        ),
      [],
    );
    for (const c of commits) {
      hours[localParts(new Date(c.commit.author.date)).hour]++;
      total++;
    }
  }
  return total >= 10 ? hours : null;
}

export function aggregateLanguages(repos: GqlRepo[]): LanguageShare[] {
  const map = new Map<string, LanguageShare>();
  for (const r of repos) {
    for (const e of r.languages?.edges ?? []) {
      const cur = map.get(e.node.name) ?? { name: e.node.name, color: e.node.color ?? "#8b8b8f", bytes: 0 };
      cur.bytes += e.size;
      map.set(e.node.name, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.bytes - a.bytes);
}

export async function fetchGithub(login = config.login): Promise<Omit<ProfileData, "weather" | "generatedAt">> {
  const { user } = await graphql<MainQuery>(MAIN_QUERY, { login });
  const cc = user.contributionsCollection;
  const weeks: ContributionDay[][] = cc.contributionCalendar.weeks.map((w) =>
    w.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
      level: LEVELS[d.contributionLevel] ?? 0,
      weekday: d.weekday,
    })),
  );
  const years = await soft("year totals", () => yearTotals(login, cc.contributionYears), {} as Record<number, number>);
  const thisYear = localParts(new Date()).year;
  const lastYearTotal = cc.contributionCalendar.totalContributions;
  const allTime = Object.values(years).reduce((a, b) => a + b, 0);
  const owned = user.repositories.nodes;
  const pinned = user.pinnedItems.nodes.filter((r) => r && r.name);
  const projects = (pinned.length ? pinned : [...owned].filter((r) => !r.isArchived && r.name !== login).sort((a, b) => b.stargazerCount - a.stargazerCount))
    .slice(0, 4)
    .map(toRepo);
  const [events, commitHours] = await Promise.all([
    soft("events", () => fetchEvents(login), []),
    soft("commit hours", () => fetchCommitHours(login, owned.map((r) => ({ owner: r.owner.login, name: r.name }))), null),
  ]);
  return {
    source: "graphql",
    login: user.login,
    name: user.name || config.name,
    createdAt: user.createdAt,
    followers: user.followers.totalCount,
    following: user.following.totalCount,
    repoCount: user.repositories.totalCount,
    weeks,
    lastYearTotal,
    yearTotal: years[thisYear] ?? sumYear(weeks, thisYear),
    allTimeTotal: allTime || lastYearTotal,
    totals: {
      commits: cc.totalCommitContributions,
      pullRequests: user.pullRequests.totalCount,
      issues: user.issues.totalCount,
      reviews: cc.totalPullRequestReviewContributions,
      stars: owned.reduce((a, r) => a + r.stargazerCount, 0),
      forks: owned.reduce((a, r) => a + r.forkCount, 0),
      privateContributions: cc.restrictedContributionsCount,
    },
    languages: aggregateLanguages(owned),
    projects,
    events,
    commitHours,
  };
}

export function sumYear(weeks: ContributionDay[][], year: number): number {
  return weeks.flat().filter((d) => d.date.startsWith(`${year}-`)).reduce((a, d) => a + d.count, 0);
}
