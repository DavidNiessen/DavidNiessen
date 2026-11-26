export type ThemeName = "dark" | "light";

/**
 * Design language: Swiss editorial. Flat paper and ink, one red spot
 * colour, sharp corners, hairline rules, a strict grid and very large
 * condensed type. No gradients, glows, shadows or rounded glass.
 */
export interface Theme {
  name: ThemeName;
  paper: string;
  ink: string;
  muted: string;
  /** hairlines and empty cells */
  faint: string;
  red: string;
  /** text on red */
  onRed: string;
  /** contribution levels 0..4: greys up to ink, red on top */
  heat: [string, string, string, string, string];
}

export const themes: Record<ThemeName, Theme> = {
  dark: {
    name: "dark",
    paper: "#121211",
    ink: "#efede8",
    muted: "#8d8a83",
    faint: "#2b2a28",
    red: "#ec3a22",
    onRed: "#121211",
    heat: ["#232321", "#4d4b47", "#8d8a83", "#efede8", "#ec3a22"],
  },
  light: {
    name: "light",
    paper: "#f3f1ec",
    ink: "#151514",
    muted: "#7a776f",
    faint: "#dedad2",
    red: "#e0301e",
    onRed: "#f3f1ec",
    heat: ["#e3dfd7", "#bdb8ae", "#86827a", "#151514", "#e0301e"],
  },
};

export const themeList: Theme[] = [themes.dark, themes.light];
