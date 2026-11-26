export type ThemeName = "dark" | "light";

export interface Theme {
  name: ThemeName;
  /** page / outer background */
  bg: string;
  /** card surface */
  card: string;
  /** raised element on a card */
  raised: string;
  border: string;
  text: string;
  muted: string;
  subtle: string;
  accent: string;
  glow: string;
  /** contribution heat scale, level 0..4 */
  heat: [string, string, string, string, string];
}

export const themes: Record<ThemeName, Theme> = {
  dark: {
    name: "dark",
    bg: "#0d0d0f",
    card: "#18181b",
    raised: "#242427",
    border: "#27272a",
    text: "#fafafa",
    muted: "#8b8b8f",
    subtle: "#3f3f46",
    accent: "#dc2626",
    glow: "#ef4444",
    heat: ["#1e1e20", "#4c1515", "#7f1d1d", "#b91c1c", "#ef4444"],
  },
  light: {
    name: "light",
    bg: "#ffffff",
    card: "#fafafa",
    raised: "#f4f4f5",
    border: "#e4e4e7",
    text: "#18181b",
    muted: "#71717a",
    subtle: "#d4d4d8",
    accent: "#dc2626",
    glow: "#b91c1c",
    heat: ["#ebedf0", "#fecaca", "#f87171", "#dc2626", "#991b1b"],
  },
};

export const themeList: Theme[] = [themes.dark, themes.light];
