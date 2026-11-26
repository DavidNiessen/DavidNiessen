import { describe, expect, it } from "vitest";
import { derive, streaks } from "../src/data/derive.js";
import { mapEvent } from "../src/data/github.js";
import { mockData } from "../src/data/mock.js";
import { parseContributionsHtml } from "../src/data/scrape.js";
import type { ContributionDay } from "../src/data/types.js";

const days = (counts: number[]): ContributionDay[] =>
  counts.map((count, i) => ({ date: `2026-01-${String(i + 1).padStart(2, "0")}`, count, level: count ? 1 : 0, weekday: (i + 4) % 7 }));

describe("streaks", () => {
  it("finds current and longest streaks", () => {
    const s = streaks(days([1, 1, 0, 2, 3, 4, 0, 1, 1]));
    expect(s.longest).toBe(3);
    expect(s.current).toBe(2);
  });
  it("keeps the current streak alive when today is still empty", () => {
    expect(streaks(days([0, 1, 1, 1, 0])).current).toBe(3);
  });
  it("is zero with no activity", () => {
    expect(streaks(days([0, 0, 0]))).toMatchObject({ current: 0, longest: 0 });
  });
});

describe("contributions page scraper", () => {
  it("parses cells and tooltips", () => {
    const html = `
      <td tabindex="0" data-ix="0" aria-selected="false" aria-describedby="x" style="width: 10px" data-date="2026-11-22" id="contribution-day-component-0-0" data-level="0" role="gridcell" data-view-component="true" class="ContributionCalendar-day"></td>
      <td tabindex="0" data-date="2026-11-23" id="contribution-day-component-1-0" data-level="2" class="ContributionCalendar-day"></td>
      <tool-tip for="contribution-day-component-0-0" class="sr-only">No contributions on November 22nd.</tool-tip>
      <tool-tip for="contribution-day-component-1-0" class="sr-only">1,204 contributions on November 23rd.</tool-tip>`;
    const weeks = parseContributionsHtml(html);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].map((d) => [d.date, d.count, d.level, d.weekday])).toEqual([
      ["2026-11-22", 0, 0, 0],
      ["2026-11-23", 1204, 2, 1],
    ]);
  });
});

describe("events", () => {
  it("maps merged pull requests and pushes", () => {
    const base = { repo: { name: "DavidNiessen/soundwave" }, created_at: "2026-11-26T10:00:00Z" };
    expect(mapEvent({ ...base, type: "PullRequestEvent", payload: { action: "closed", pull_request: { number: 4, merged: true } } })).toMatchObject({ kind: "merge", repo: "soundwave", detail: "PR #4 merged" });
    expect(mapEvent({ ...base, type: "PushEvent", payload: { size: 2, ref: "refs/heads/main" } })).toMatchObject({ kind: "push", detail: "2 commits → main" });
    expect(mapEvent({ ...base, type: "GollumEvent", payload: {} })).toBeNull();
  });
});

describe("mock data", () => {
  it("is deterministic and derivable", () => {
    const now = new Date("2026-11-27T02:17:00Z");
    const a = mockData(now);
    expect(mockData(now).weeks).toEqual(a.weeks);
    const d = derive(a);
    expect(d.days.length).toBeGreaterThan(360);
    expect(d.weekdays).toHaveLength(7);
  });
});
