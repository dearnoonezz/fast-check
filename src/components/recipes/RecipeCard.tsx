import { ChefHat, Pencil, PlusCircle, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/common/ConfirmButton";
import { recipeStats, type IngredientMap } from "@/lib/calc";
import { money, pct, qty } from "@/lib/format";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export function RecipeCard({
  recipe,
  map,
  onEdit,
  index = 0,
}: {
  recipe: Recipe;
  map: IngredientMap;
  onEdit: () => void;
  index?: number;
}) {
  const { data, deleteRecipe, setPlanQuantity } = useAppStore();
  const stats = recipeStats(recipe, map);
  const inPlan = data.plan.find((p) => p.recipeId === recipe.id)?.quantity ?? 0;

  return (
    <article className="surface-card flex flex-col overflow-hidden animate-fade-up" style={{ animationDelay: `${Math.min(index, 10) * 25}ms` }}>
      <div className="flex gap-3 p-4">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface text-muted-foreground">
          {recipe.image ? <img src={recipe.image} alt={recipe.name} className="size-full object-cover" /> : <ChefHat className="size-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-semibold">{recipe.name}</h3>
            <div className="-mr-2 -mt-1 flex shrink-0">
              <Button size="icon" variant="ghost" aria-label={`Editar ${recipe.name}`} onClick={onEdit}>
                <Pencil />
              </Button>
              <ConfirmButton
                title={`Excluir "${recipe.name}"?`}
                description="A receita também sai da produção planejada."
                confirmLabel="Excluir"
                onConfirm={() => { deleteRecipe(recipe.id); toast.success("Receita excluída."); }}
                trigger={
                  <Button size="icon" variant="ghost" aria-label={`Excluir ${recipe.name}`} className="hover:text-destructive">
                    <Trash2 />
                  </Button>
                }
              />
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {recipe.category ? <Badge variant="secondary">{recipe.category}</Badge> : null}
            <Badge variant="outline" className="text-muted-foreground">{qty(recipe.yieldPerCraft)} un / fabricação</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-y bg-border text-sm sm:grid-cols-4">
        <Cell label="Venda" value={money(recipe.salePrice)} />
        <Cell label="Custo/un" value={money(stats.costPerUnit)} />
        <Cell label="Lucro/un" value={money(stats.profitPerUnit)} tone={stats.profitPerUnit < 0 ? "bad" : "good"} />
        <Cell label="Margem" value={pct(stats.margin)} tone={stats.margin < 0 ? "bad" : "good"} />
      </div>

      <ul className="flex-1 space-y-1 px-4 py-3 text-sm">
        {recipe.items.length === 0 ? (
          <li className="flex items-center gap-1.5 text-warning"><TriangleAlert className="size-4" /> Sem ingredientes</li>
        ) : (
          recipe.items.map((it) => {
            const ing = map.get(it.ingredientId);
            return (
              <li key={it.ingredientId} className="flex justify-between gap-2 text-muted-foreground">
                <span className="truncate">{qty(it.quantity)}× {ing?.name ?? "Ingrediente removido"}</span>
                <span className="tabular">{ing ? money(ing.unitPrice * it.quantity) : "—"}</span>
              </li>
            );
          })
        )}
      </ul>

      <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
        <span className="text-xs text-muted-foreground">
          Custo por fabricação: <strong className="tabular text-foreground">{money(stats.costPerCraft)}</strong>
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setPlanQuantity(recipe.id, inPlan + recipe.yieldPerCraft);
            toast.success(`${recipe.name}: ${qty(inPlan + recipe.yieldPerCraft)} un na produção.`);
          }}
        >
          <PlusCircle /> Produzir
        </Button>
      </div>
    </article>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="bg-card px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("font-semibold tabular", tone === "good" && "text-primary", tone === "bad" && "text-destructive")}>{value}</p>
    </div>
  );
}
