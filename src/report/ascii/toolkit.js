/**
 * Box-drawing helpers for the ASCII-art report. Everything here returns an
 * array of lines; sections join them. Widths count code points, which is
 * right for every glyph used (box drawing, blocks, ♠♥♦♣, ✓ ✗ ★).
 */
const width = (text) => [...text].length;

export const padEnd = (text, size) => text + " ".repeat(Math.max(0, size - width(text)));
export const padStart = (text, size) => " ".repeat(Math.max(0, size - width(text))) + text;

const align = (text, size, how) => (how === "right" ? padStart(text, size) : padEnd(text, size));

/** A framed block of text, e.g. the verdict. Grows to fit its longest line. */
export function box(lines, { title = "", inner: wanted = 66 } = {}) {
  const inner = Math.max(wanted, ...lines.map((line) => width(line) + 2), width(title) + 5);
  const top = title
    ? `╔═ ${title} ${"═".repeat(Math.max(0, inner - width(title) - 3))}╗`
    : `╔${"═".repeat(inner)}╗`;
  return [top, ...lines.map((line) => `║ ${padEnd(line, inner - 2)} ║`), `╚${"═".repeat(inner)}╝`];
}

/** A ruled table. `aligns[i]` is "left" or "right". */
export function table(headers, rows, aligns = []) {
  const sizes = headers.map((h, i) => Math.max(width(h), ...rows.map((row) => width(row[i]))));
  const line = (cells) =>
    `│ ${cells.map((cell, i) => align(cell, sizes[i], aligns[i])).join(" │ ")} │`;
  const rule = (l, m, r) => l + sizes.map((s) => "─".repeat(s + 2)).join(m) + r;
  return [rule("┌", "┬", "┐"), line(headers), rule("├", "┼", "┤"), ...rows.map(line), rule("└", "┴", "┘")];
}

const EIGHTHS = ["", "▏", "▎", "▍", "▌", "▋", "▊", "▉"];

/** A horizontal bar with eighth-of-a-cell resolution. */
export function bar(value, max, cells) {
  const eighths = Math.round((Math.max(0, value) / max) * cells * 8);
  return "█".repeat(Math.floor(eighths / 8)) + EIGHTHS[eighths % 8];
}

/** One bar split in segments, one fill per segment, total = `cells`. */
export function stacked(shares, fills, cells) {
  let used = 0;
  let acc = 0;
  return shares
    .map((share, i) => {
      acc += share;
      const end = i === shares.length - 1 ? cells : Math.round(acc * cells);
      const segment = fills[i].repeat(Math.max(0, end - used));
      used = Math.max(used, end);
      return segment;
    })
    .join("");
}

/** Playing cards drawn side by side: [{ label: "4", suit: "♥" }]. */
export function cards(list) {
  const face = (text) => padEnd(text, 2);
  return [
    list.map(() => "┌────┐").join(""),
    list.map((c) => `│${face(c.label)}  │`).join(""),
    list.map((c) => `│  ${padStart(c.suit, 2)}│`).join(""),
    list.map(() => "└────┘").join(""),
  ];
}

export const fence = (lines) => ["```text", ...lines, "```"];
