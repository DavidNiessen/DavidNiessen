export interface ContributionDay {
  /** YYYY-MM-DD */
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  /** 0 = Sunday */
  weekday: number;
}

export interface Repo {
  name: string;
  owner: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: { name: string; color: string } | null;
}

export interface RepoSummary {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: { name: string; color: string } | null;
  /** ISO timestamps */
  createdAt: string;
  pushedAt: string;
}

export interface LanguageShare {
  name: string;
  color: string;
  bytes: number;
}

export type EventKind = "push" | "pr" | "merge" | "issue" | "review" | "release" | "create" | "star" | "fork" | "other";

export interface ActivityEvent {
  kind: EventKind;
  repo: string;
  detail: string;
  /** ISO timestamp */
  time: string;
}

export interface Weather {
  temperature: number;
  min: number;
  max: number;
  /** WMO weather code */
  code: number;
  isDay: boolean;
  wind: number;
}

export interface ProfileData {
  source: "graphql" | "scrape" | "mock";
  generatedAt: string;
  login: string;
  name: string;
  createdAt: string | null;
  followers: number;
  following: number;
  repoCount: number;
  /** last ~53 weeks, Sunday-first weeks, oldest first */
  weeks: ContributionDay[][];
  lastYearTotal: number;
  /** contributions in the current calendar year */
  yearTotal: number;
  /** sum over all contribution years (falls back to lastYearTotal) */
  allTimeTotal: number;
  totals: {
    commits: number | null;
    pullRequests: number | null;
    issues: number | null;
    reviews: number | null;
    stars: number | null;
    forks: number | null;
    privateContributions: number | null;
  };
  languages: LanguageShare[];
  projects: Repo[];
  /** owned, non-fork repositories (most recently pushed first) */
  repos: RepoSummary[];
  /** contributions per calendar year */
  yearTotals: Record<number, number>;
  events: ActivityEvent[];
  /** commits per local hour 0..23, null if unavailable */
  commitHours: number[] | null;
  weather: Weather | null;
}
