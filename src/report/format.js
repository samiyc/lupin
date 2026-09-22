/**
 * French number formatting, shared by every renderer: decimal comma, a space
 * before the percent sign and between thousands.
 */
export function pct(share, digits = 1) {
  if (share === null || share === undefined) return "—";
  return `${(share * 100).toFixed(digits).replace(".", ",")} %`;
}

/** Two decimals under 1 %, one above: 0,17 % but 12,3 %. */
export const smartPct = (share) => pct(share, share < 0.01 ? 2 : 1);

export function int(n) {
  const digits = String(Math.round(Math.abs(n)));
  const groups = [];
  for (let end = digits.length; end > 0; end -= 3) groups.unshift(digits.slice(Math.max(0, end - 3), end));
  return (n < 0 ? "-" : "") + groups.join(" ");
}

export const dateFr = (iso) => iso.slice(0, 10).split("-").reverse().join("/");
