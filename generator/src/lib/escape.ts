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
