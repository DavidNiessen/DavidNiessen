import { config } from "../config.js";
import { fetchGithub } from "./github.js";
import { token, soft } from "./http.js";
import { mockData } from "./mock.js";
import { fetchScraped } from "./scrape.js";
import type { ProfileData } from "./types.js";
import { fetchWeather } from "./weather.js";

export * from "./types.js";

/** Load profile data: GraphQL (token) → scraped calendar → error. `mock` skips the network. */
export async function loadData(opts: { mock?: boolean; now?: Date } = {}): Promise<ProfileData> {
  const now = opts.now ?? new Date();
  if (opts.mock) return mockData(now);
  let base: Omit<ProfileData, "weather" | "generatedAt">;
  try {
    if (!token()) throw new Error("no token set");
    base = await fetchGithub(config.login);
  } catch (e) {
    console.warn(`⚠ GraphQL unavailable (${(e as Error).message}), falling back to scraping`);
    base = await fetchScraped(config.login);
  }
  const weather = await soft("weather", () => fetchWeather(), null);
  return { ...base, weather, generatedAt: now.toISOString() };
}
