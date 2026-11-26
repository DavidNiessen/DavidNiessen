import { config } from "../config.js";
import { getJson } from "./http.js";
import type { Weather } from "./types.js";

interface OpenMeteo {
  current: { temperature_2m: number; weather_code: number; is_day: number; wind_speed_10m: number };
  daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
}

export async function fetchWeather(loc = config.location): Promise<Weather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}` +
    `&current=temperature_2m,weather_code,is_day,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min` +
    `&timezone=Europe%2FBerlin&forecast_days=1`;
  const w = await getJson<OpenMeteo>(url);
  return {
    temperature: w.current.temperature_2m,
    code: w.current.weather_code,
    isDay: w.current.is_day === 1,
    wind: w.current.wind_speed_10m,
    min: w.daily.temperature_2m_min[0],
    max: w.daily.temperature_2m_max[0],
  };
}

export type WeatherKind = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm";

/** Map WMO weather codes to a small set of illustrated kinds. */
export function weatherKind(code: number): WeatherKind {
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "cloudy";
  if (code <= 48) return "fog";
  if (code <= 57) return "drizzle";
  if (code <= 67 || (code >= 80 && code <= 82)) return "rain";
  if (code <= 77 || code === 85 || code === 86) return "snow";
  return "storm";
}

export function weatherLabel(kind: WeatherKind): string {
  return {
    clear: "Clear sky",
    partly: "Partly cloudy",
    cloudy: "Overcast",
    fog: "Foggy",
    drizzle: "Drizzle",
    rain: "Rain",
    snow: "Snow",
    storm: "Thunderstorm",
  }[kind];
}
