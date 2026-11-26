import { describe, expect, it } from "vitest";
import { age, daysAlive, daysUntilBirthday, localParts, moonPhase, parseBirthday, yearProgress } from "../src/lib/astro.js";

const b = parseBirthday("2004-12-31");
const at = (iso: string) => localParts(new Date(iso));

describe("birthday maths", () => {
  it("ages on the birthday, not before", () => {
    expect(age(b, at("2026-12-30T12:00:00Z"))).toBe(21);
    expect(age(b, at("2026-12-31T12:00:00Z"))).toBe(22);
  });
  it("counts down to the next birthday across the year boundary", () => {
    expect(daysUntilBirthday(b, at("2026-12-31T12:00:00Z"))).toBe(0);
    expect(daysUntilBirthday(b, at("2027-01-01T12:00:00Z"))).toBe(364);
    expect(daysUntilBirthday(b, at("2026-11-27T12:00:00Z"))).toBe(34);
  });
  it("counts days alive", () => {
    expect(daysAlive(b, at("2005-01-01T12:00:00Z"))).toBe(1);
  });
});

describe("calendar", () => {
  it("uses Berlin local time", () => {
    const p = at("2026-12-31T23:30:00Z");
    expect([p.year, p.month, p.day, p.hour]).toEqual([2027, 1, 1, 0]);
  });
  it("computes year progress including leap years", () => {
    expect(yearProgress(at("2028-12-31T12:00:00Z")).daysInYear).toBe(366);
    expect(yearProgress(at("2026-01-01T12:00:00Z")).dayOfYear).toBe(1);
  });
});

describe("moon", () => {
  it("is full around a known full moon and new around a known new moon", () => {
    expect(moonPhase(new Date("2024-01-25T17:54:00Z")).illumination).toBeGreaterThan(0.97);
    expect(moonPhase(new Date("2024-02-09T22:59:00Z")).illumination).toBeLessThan(0.03);
  });
});
