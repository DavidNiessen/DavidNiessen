/** Escape a string for safe use inside SVG/XML text and attribute values. */
export function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Truncate to max characters, adding an ellipsis when cut. */
export function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, Math.max(0, max - 1))}…` : value;
}

/** Format an integer with thin-space thousands separators (1 234 567). */
export function groupDigits(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Round to fixed decimals and drop trailing zeros. */
export function num(n: number, digits = 2): string {
  return Number(n.toFixed(digits)).toString();
}

/** Greedy word wrap to at most `maxLines` lines of `maxChars` (monospace), ellipsising the last line. */
export function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = clip(`${kept[maxLines - 1]} ${lines[maxLines]}`, maxChars);
    if (!kept[maxLines - 1].endsWith("…")) kept[maxLines - 1] = clip(kept[maxLines - 1] + "…", maxChars);
    return kept;
  }
  return lines.map((l) => clip(l, maxChars));
}

/** "just now", "5 min ago", "3 h ago", "2 d ago", "4 mo ago". */
export function ago(iso: string, now: Date): string {
  const s = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 45) return `${Math.floor(s / 86400)} d ago`;
  if (s < 86400 * 365) return `${Math.floor(s / 86400 / 30)} mo ago`;
  return `${Math.floor(s / 86400 / 365)} y ago`;
}
