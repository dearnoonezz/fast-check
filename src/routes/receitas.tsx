import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChefHat, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterChip } from "@/components/common/FilterChip";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput, normalize } from "@/components/common/SearchInput";
import { uniqueCategories } from "@/components/common/CategoryInput";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeFormDialog } from "@/components/recipes/RecipeFormDialog";
import { toMap } from "@/lib/calc";
import type { Recipe } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/receitas")({
  head: () => ({
    meta: [
      { title: "Receitas — Craft Food" },
      { name: "description", content: "Crie receitas e veja custo de fabricação, lucro por unidade e margem." },
      { property: "og:title", content: "Receitas — Craft Food" },
      { property: "og:description", content: "Crie receitas e veja custo de fabricação, lucro por unidade e margem." },
    ],
  }),
  component: RecipesPage,
});

function RecipesPage() {
  const { data } = useAppStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState<Recipe | undefined>();
  const [editOpen, setEditOpen] = useState(false);
  const map = toMap(data.ingredients);
  const categories = uniqueCategories(data.recipes);

  const list = data.recipes
    .filter((r) => !category || r.category.trim() === category)
    .filter((r) => normalize(r.name + " " + r.category).includes(normalize(search)))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const addButton = (
    <RecipeFormDialog
      trigger={
        <Button>
          <Plus /> Nova receita
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader title="Receitas" description="Custos atualizados automaticamente com os preços dos ingredientes." actions={addButton} />

      {data.recipes.length === 0 ? (
        <EmptyState icon={ChefHat} title="Nenhuma receita criada" description="Monte suas receitas com os ingredientes e quantidades usados no servidor." action={addButton} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar receita" />
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                <FilterChip active={!category} onClick={() => setCategory(null)}>Todas</FilterChip>
                {categories.map((c) => (
                  <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</FilterChip>
                ))}
              </div>
            ) : null}
          </div>
          {list.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma receita encontrada.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((r, i) => (
                <RecipeCard key={r.id} recipe={r} map={map} index={i} onEdit={() => { setEditing(r); setEditOpen(true); }} />
              ))}
            </div>
          )}
        </>
      )}

      <RecipeFormDialog recipe={editing} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
