import { z } from "zod";
import { emptyData, type AppData } from "./types";

export const STORAGE_KEY = "craft-food:data:v1";

const num = z.coerce.number().finite();

const ingredientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  unitPrice: num.min(0),
  stock: num.min(0).nullable().optional().default(null),
  category: z.string().default(""),
  packagePrice: num.min(0).nullable().optional(),
  packageUnits: num.min(0).nullable().optional(),
});

const recipeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  image: z.string().nullable().optional(),
  category: z.string().default(""),
  items: z.array(z.object({ ingredientId: z.string(), quantity: num.min(0) })).default([]),
  yieldPerCraft: num.min(1).default(1),
  salePrice: num.min(0).default(0),
});

export const appDataSchema = z.object({
  version: z.literal(1).default(1),
  ingredients: z.array(ingredientSchema).default([]),
  recipes: z.array(recipeSchema).default([]),
  plan: z.array(z.object({ recipeId: z.string(), quantity: num.min(0) })).default([]),
  purchased: z.array(z.string()).default([]),
});

/** Validates unknown JSON (backup file or stored value). Throws on invalid shape. */
export function parseAppData(raw: unknown): AppData {
  const parsed = appDataSchema.parse(raw);
  return parsed as AppData;
}

export function loadData(): AppData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return parseAppData(JSON.parse(raw));
  } catch (error) {
    console.error("Falha ao ler dados salvos", error);
    return emptyData();
  }
}

export function saveData(data: AppData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Falha ao salvar dados", error);
    return false;
  }
}

export function downloadBackup(data: AppData) {
  const blob = new Blob([JSON.stringify({ app: "craft-food", ...data }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `craft-food-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
