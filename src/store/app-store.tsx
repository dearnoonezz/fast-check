import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { loadData, saveData, STORAGE_KEY } from "@/lib/storage";
import { emptyData, type AppData, type Ingredient, type Recipe } from "@/lib/types";

interface AppStore {
  data: AppData;
  ready: boolean;
  upsertIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  upsertRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  setPlanQuantity: (recipeId: string, quantity: number) => void;
  clearPlan: () => void;
  togglePurchased: (ingredientId: string) => void;
  setPurchased: (ids: string[]) => void;
  replaceData: (data: AppData) => void;
  resetData: () => void;
}

const StoreContext = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const warned = useRef(false);

  useEffect(() => {
    setData(loadData());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setData(loadData());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const ok = saveData(data);
    if (!ok && !warned.current) {
      warned.current = true;
      toast.error("Não foi possível salvar. O armazenamento do navegador pode estar cheio.");
    }
  }, [data, ready]);

  const upsertIngredient = useCallback((ingredient: Ingredient) => {
    setData((d) => {
      const exists = d.ingredients.some((i) => i.id === ingredient.id);
      return {
        ...d,
        purchased: [],
        ingredients: exists
          ? d.ingredients.map((i) => (i.id === ingredient.id ? ingredient : i))
          : [...d.ingredients, ingredient],
      };
    });
  }, []);

  const deleteIngredient = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      ingredients: d.ingredients.filter((i) => i.id !== id),
      recipes: d.recipes.map((r) => ({ ...r, items: r.items.filter((it) => it.ingredientId !== id) })),
      purchased: d.purchased.filter((p) => p !== id),
    }));
  }, []);

  const upsertRecipe = useCallback((recipe: Recipe) => {
    setData((d) => {
      const exists = d.recipes.some((r) => r.id === recipe.id);
      return {
        ...d,
        purchased: [],
        recipes: exists ? d.recipes.map((r) => (r.id === recipe.id ? recipe : r)) : [...d.recipes, recipe],
      };
    });
  }, []);

  const deleteRecipe = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      recipes: d.recipes.filter((r) => r.id !== id),
      plan: d.plan.filter((p) => p.recipeId !== id),
      purchased: [],
    }));
  }, []);

  const setPlanQuantity = useCallback((recipeId: string, quantity: number) => {
    setData((d) => {
      const q = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
      const others = d.plan.filter((p) => p.recipeId !== recipeId);
      if (q === 0) return { ...d, plan: others, purchased: [] };
      const exists = d.plan.some((p) => p.recipeId === recipeId);
      return {
        ...d,
        purchased: [],
        plan: exists
          ? d.plan.map((p) => (p.recipeId === recipeId ? { ...p, quantity: q } : p))
          : [...d.plan, { recipeId, quantity: q }],
      };
    });
  }, []);

  const clearPlan = useCallback(() => setData((d) => ({ ...d, plan: [], purchased: [] })), []);

  const togglePurchased = useCallback((ingredientId: string) => {
    setData((d) => ({
      ...d,
      purchased: d.purchased.includes(ingredientId)
        ? d.purchased.filter((p) => p !== ingredientId)
        : [...d.purchased, ingredientId],
    }));
  }, []);

  const setPurchased = useCallback((ids: string[]) => setData((d) => ({ ...d, purchased: ids })), []);
  const replaceData = useCallback((next: AppData) => setData(next), []);
  const resetData = useCallback(() => setData(emptyData()), []);

  const value = useMemo<AppStore>(
    () => ({
      data,
      ready,
      upsertIngredient,
      deleteIngredient,
      upsertRecipe,
      deleteRecipe,
      setPlanQuantity,
      clearPlan,
      togglePurchased,
      setPurchased,
      replaceData,
      resetData,
    }),
    [data, ready, upsertIngredient, deleteIngredient, upsertRecipe, deleteRecipe, setPlanQuantity, clearPlan, togglePurchased, setPurchased, replaceData, resetData],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}
