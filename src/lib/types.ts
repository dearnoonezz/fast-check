export interface Ingredient {
  id: string;
  name: string;
  /** Price of a single unit, in $ (GTA RP virtual money). */
  unitPrice: number;
  /** Units in stock. `null` means stock is not tracked. */
  stock: number | null;
  category: string;
  /** Optional package info used to derive unitPrice. */
  packagePrice?: number | null;
  packageUnits?: number | null;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  image?: string | null;
  category: string;
  items: RecipeItem[];
  /** Units produced per craft. */
  yieldPerCraft: number;
  /** Sale price per unit, in $. */
  salePrice: number;
}

export interface PlanItem {
  recipeId: string;
  /** Desired number of food units. */
  quantity: number;
}

export interface AppData {
  version: 1;
  ingredients: Ingredient[];
  recipes: Recipe[];
  plan: PlanItem[];
  /** Ingredient ids marked as purchased in the shopping list. */
  purchased: string[];
}

export const emptyData = (): AppData => ({
  version: 1,
  ingredients: [],
  recipes: [],
  plan: [],
  purchased: [],
});
