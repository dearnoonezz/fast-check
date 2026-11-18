const moneyFmt = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const qtyFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const pctFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Formats a value as GTA RP money: "$ 1.234,56". */
export function money(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const sign = safe < 0 ? "-" : "";
  return `${sign}$ ${moneyFmt.format(Math.abs(safe))}`;
}

export function qty(value: number): string {
  return qtyFmt.format(Number.isFinite(value) ? value : 0);
}

export function pct(value: number): string {
  return `${pctFmt.format(Number.isFinite(value) ? value : 0)}%`;
}

/** Parses user number input accepting both "1,5" and "1.5". Returns NaN when invalid. */
export function parseNum(raw: string): number {
  const cleaned = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (cleaned === "") return NaN;
  return Number(cleaned);
}
