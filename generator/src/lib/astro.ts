export const TIME_ZONE = "Europe/Berlin";

export interface LocalDate {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = Sunday
}

/** Calendar fields of `date` in the given IANA zone. */
export function localParts(date: Date, timeZone = TIME_ZONE): LocalDate {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour, minute: +p.minute, weekday: wd };
}

const DAY = 86_400_000;

function utcDay(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d);
}

export function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Day of year (1-based) and fraction of the year elapsed (by local calendar day). */
export function yearProgress(now: LocalDate): { dayOfYear: number; daysInYear: number; fraction: number } {
  const dayOfYear = (utcDay(now.year, now.month, now.day) - utcDay(now.year, 1, 1)) / DAY + 1;
  const daysInYear = isLeap(now.year) ? 366 : 365;
  return { dayOfYear, daysInYear, fraction: dayOfYear / daysInYear };
}

export interface Birthday {
  year: number;
  month: number;
  day: number;
}

export function parseBirthday(iso: string): Birthday {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

/** Age in completed years on the local date. */
export function age(b: Birthday, now: LocalDate): number {
  const had = now.month > b.month || (now.month === b.month && now.day >= b.day);
  return now.year - b.year - (had ? 0 : 1);
}

/** Days since birth (inclusive of today being day N). */
export function daysAlive(b: Birthday, now: LocalDate): number {
  return Math.round((utcDay(now.year, now.month, now.day) - utcDay(b.year, b.month, b.day)) / DAY);
}

/** Days until the next birthday (0 = today). Feb 29 birthdays fall on Mar 1 in common years. */
export function daysUntilBirthday(b: Birthday, now: LocalDate): number {
  const today = utcDay(now.year, now.month, now.day);
  let next = utcDay(now.year, b.month, b.day);
  if (next < today) next = utcDay(now.year + 1, b.month, b.day);
  return Math.round((next - today) / DAY);
}

export interface MoonPhase {
  /** 0 = new, 0.5 = full, 1 = new again */
  phase: number;
  /** illuminated fraction 0..1 */
  illumination: number;
  name: string;
  /** true while the moon is growing (lit side on the right, northern hemisphere) */
  waxing: boolean;
}

const SYNODIC = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

/** Mean moon phase; accurate to well under a day, plenty for a profile card. */
export function moonPhase(date: Date): MoonPhase {
  const days = (date.getTime() - KNOWN_NEW_MOON) / DAY;
  const phase = (((days / SYNODIC) % 1) + 1) % 1;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const names = [
    "New Moon",
    "Waxing Crescent",
    "First Quarter",
    "Waxing Gibbous",
    "Full Moon",
    "Waning Gibbous",
    "Last Quarter",
    "Waning Crescent",
  ];
  const name = names[Math.round(phase * 8) % 8];
  return { phase, illumination, name, waxing: phase < 0.5 };
}

/** Greeting for the local hour. */
export function greeting(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatLongDate(d: LocalDate): string {
  return `${WEEKDAYS[d.weekday]}, ${d.day} ${MONTHS[d.month - 1]} ${d.year}`;
}

export function monthName(m: number): string {
  return MONTHS[m - 1];
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
