import { money, qty } from "./format";
import type { ProductionResult } from "./calc";

export type ShareFormat = "discord" | "whatsapp";

export function formatShoppingList(
  result: ProductionResult,
  purchased: Set<string>,
  format: ShareFormat,
): string {
  const bold = (s: string) => (format === "discord" ? `**${s}**` : `*${s}*`);
  const strike = (s: string) => (format === "discord" ? `~~${s}~~` : `~${s}~`);
  const items = result.needs.filter((n) => n.missing > 0);

  const lines: string[] = [bold("Lista de compras — Craft Food"), ""];
  if (result.lines.length > 0) {
    lines.push(bold("Produção:"));
    for (const l of result.lines) lines.push(`• ${l.recipe.name}: ${qty(l.produced)} un`);
    lines.push("");
  }
  lines.push(bold("Comprar:"));
  if (items.length === 0) lines.push("Nada a comprar, o estoque cobre tudo.");
  for (const n of items) {
    const text = `${n.ingredient.name}: ${qty(n.missing)} un (${money(n.missingCost)})`;
    lines.push(purchased.has(n.ingredient.id) ? `[x] ${strike(text)}` : `[ ] ${text}`);
  }
  const pending = items
    .filter((n) => !purchased.has(n.ingredient.id))
    .reduce((s, n) => s + n.missingCost, 0);
  lines.push("");
  lines.push(`${bold("Total:")} ${money(result.shoppingCost)}`);
  if (pending !== result.shoppingCost) lines.push(`${bold("Pendente:")} ${money(pending)}`);
  return lines.join("\n");
}
