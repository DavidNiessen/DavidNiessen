import type { ContributionDay, ProfileData } from "./types.js";

export function flatDays(weeks: ContributionDay[][]): ContributionDay[] {
  return weeks.flat().sort((a, b) => a.date.localeCompare(b.date));
}

export interface Streaks {
  current: number;
  longest: number;
  /** YYYY-MM-DD of the longest streak start/end */
  longestStart: string | null;
  longestEnd: string | null;
}

/**
 * Streaks over consecutive days with at least one contribution.
 * The current streak survives an empty *today* (the day is not over yet),
 * so it counts back from yesterday in that case.
 */
export function streaks(days: ContributionDay[]): Streaks {
  let longest = 0;
  let run = 0;
  let runStart: string | null = null;
  let longestStart: string | null = null;
  let longestEnd: string | null = null;
  for (const d of days) {
    if (d.count > 0) {
      if (run === 0) runStart = d.date;
      run++;
      if (run > longest) {
        longest = run;
        longestStart = runStart;
        longestEnd = d.date;
      }
    } else run = 0;
  }
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  let current = 0;
  while (i >= 0 && days[i].count > 0) {
    current++;
    i--;
  }
  return { current, longest, longestStart, longestEnd };
}

export function bestDay(days: ContributionDay[]): ContributionDay | null {
  return days.reduce<ContributionDay | null>((best, d) => (!best || d.count > best.count ? d : best), null);
}

/** Totals per weekday, index 0 = Monday. */
export function weekdayTotals(days: ContributionDay[]): number[] {
  const t = new Array(7).fill(0);
  for (const d of days) t[(d.weekday + 6) % 7] += d.count;
  return t;
}

export function weeklyTotals(weeks: ContributionDay[][]): number[] {
  return weeks.map((w) => w.reduce((a, d) => a + d.count, 0));
}

export function lastDays(days: ContributionDay[], n: number): ContributionDay[] {
  return days.slice(Math.max(0, days.length - n));
}

export function activeDays(days: ContributionDay[]): number {
  return days.filter((d) => d.count > 0).length;
}

export interface Derived {
  days: ContributionDay[];
  streaks: Streaks;
  best: ContributionDay | null;
  weekdays: number[];
  weekly: number[];
  active: number;
  /** average contributions per day over the calendar window */
  average: number;
  /** busiest month in the window: "YYYY-MM" and total */
  bestMonth: { month: string; total: number } | null;
}

export function derive(data: ProfileData): Derived {
  const days = flatDays(data.weeks);
  const months = new Map<string, number>();
  for (const d of days) months.set(d.date.slice(0, 7), (months.get(d.date.slice(0, 7)) ?? 0) + d.count);
  const bm = [...months.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    days,
    streaks: streaks(days),
    best: bestDay(days),
    weekdays: weekdayTotals(days),
    weekly: weeklyTotals(data.weeks),
    active: activeDays(days),
    average: days.length ? days.reduce((a, d) => a + d.count, 0) / days.length : 0,
    bestMonth: bm ? { month: bm[0], total: bm[1] } : null,
  };
}
