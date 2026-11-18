import type { AppData, Ingredient, Recipe } from "./types";

export type IngredientMap = Map<string, Ingredient>;

export const toMap = (ingredients: Ingredient[]): IngredientMap =>
  new Map(ingredients.map((i) => [i.id, i]));

export function unitPriceFromPackage(packagePrice: number, packageUnits: number): number {
  if (!(packageUnits > 0) || !(packagePrice >= 0)) return 0;
  return packagePrice / packageUnits;
}

export interface RecipeStats {
  costPerCraft: number;
  costPerUnit: number;
  profitPerUnit: number;
  /** Profit margin over the sale price, in percent. */
  margin: number;
  missingIngredientIds: string[];
}

export function recipeStats(recipe: Recipe, map: IngredientMap): RecipeStats {
  let costPerCraft = 0;
  const missingIngredientIds: string[] = [];
  for (const item of recipe.items) {
    const ing = map.get(item.ingredientId);
    if (!ing) {
      missingIngredientIds.push(item.ingredientId);
      continue;
    }
    costPerCraft += ing.unitPrice * item.quantity;
  }
  const yieldPerCraft = recipe.yieldPerCraft > 0 ? recipe.yieldPerCraft : 1;
  const costPerUnit = costPerCraft / yieldPerCraft;
  const profitPerUnit = recipe.salePrice - costPerUnit;
  const margin = recipe.salePrice > 0 ? (profitPerUnit / recipe.salePrice) * 100 : 0;
  return { costPerCraft, costPerUnit, profitPerUnit, margin, missingIngredientIds };
}

export interface ProductionLine {
  recipe: Recipe;
  desired: number;
  crafts: number;
  produced: number;
  cost: number;
  revenue: number;
  profit: number;
  margin: number;
}

export interface IngredientNeed {
  ingredient: Ingredient;
  needed: number;
  cost: number;
  stock: number | null;
  /** Units to buy: needed minus stock (or everything when stock is not tracked). */
  missing: number;
  missingCost: number;
  usedBy: string[];
}

export interface ProductionResult {
  lines: ProductionLine[];
  needs: IngredientNeed[];
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  margin: number;
  totalProduced: number;
  totalCrafts: number;
  shoppingCost: number;
  missingCount: number;
}

/**
 * Crafts are whole: asking for 7 units of a recipe that yields 5 per craft needs 2 crafts
 * and produces 10 units. Costs come from crafts; revenue from units actually produced.
 */
export function computeProduction(data: Pick<AppData, "ingredients" | "recipes" | "plan">) {
  const map = toMap(data.ingredients);
  const recipeMap = new Map(data.recipes.map((r) => [r.id, r]));
  const needMap = new Map<string, IngredientNeed>();
  const lines: ProductionLine[] = [];

  for (const item of data.plan) {
    const recipe = recipeMap.get(item.recipeId);
    if (!recipe || !(item.quantity > 0)) continue;
    const yieldPerCraft = recipe.yieldPerCraft > 0 ? recipe.yieldPerCraft : 1;
    const crafts = Math.ceil(item.quantity / yieldPerCraft - 1e-9);
    const produced = crafts * yieldPerCraft;
    let cost = 0;
    for (const ri of recipe.items) {
      const ing = map.get(ri.ingredientId);
      if (!ing) continue;
      const needed = ri.quantity * crafts;
      cost += needed * ing.unitPrice;
      const existing = needMap.get(ing.id);
      if (existing) {
        existing.needed += needed;
        if (!existing.usedBy.includes(recipe.name)) existing.usedBy.push(recipe.name);
      } else {
        needMap.set(ing.id, {
          ingredient: ing,
          needed,
          cost: 0,
          stock: ing.stock,
          missing: 0,
          missingCost: 0,
          usedBy: [recipe.name],
        });
      }
    }
    const revenue = produced * recipe.salePrice;
    const profit = revenue - cost;
    lines.push({
      recipe,
      desired: item.quantity,
      crafts,
      produced,
      cost,
      revenue,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    });
  }

  const needs = [...needMap.values()]
    .map((n) => {
      const cost = n.needed * n.ingredient.unitPrice;
      const missing = n.stock == null ? n.needed : Math.max(0, n.needed - n.stock);
      return { ...n, cost, missing, missingCost: missing * n.ingredient.unitPrice };
    })
    .sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name, "pt-BR"));

  const totalCost = lines.reduce((s, l) => s + l.cost, 0);
  const totalRevenue = lines.reduce((s, l) => s + l.revenue, 0);
  const totalProfit = totalRevenue - totalCost;

  return {
    lines,
    needs,
    totalCost,
    totalRevenue,
    totalProfit,
    margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    totalProduced: lines.reduce((s, l) => s + l.produced, 0),
    totalCrafts: lines.reduce((s, l) => s + l.crafts, 0),
    shoppingCost: needs.reduce((s, n) => s + n.missingCost, 0),
    missingCount: needs.filter((n) => n.missing > 0).length,
  } satisfies ProductionResult;
}
