import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/common/ConfirmButton";
import { EmptyState } from "@/components/common/EmptyState";
import { FilterChip } from "@/components/common/FilterChip";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchInput, normalize } from "@/components/common/SearchInput";
import { uniqueCategories } from "@/components/common/CategoryInput";
import { IngredientFormDialog } from "@/components/ingredients/IngredientFormDialog";
import { money, qty } from "@/lib/format";
import type { Ingredient } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/ingredientes")({
  head: () => ({
    meta: [
      { title: "Ingredientes — Craft Food" },
      { name: "description", content: "Cadastre ingredientes, preços unitários, pacotes e estoque." },
      { property: "og:title", content: "Ingredientes — Craft Food" },
      { property: "og:description", content: "Cadastre ingredientes, preços unitários, pacotes e estoque." },
    ],
  }),
  component: IngredientsPage,
});

function IngredientsPage() {
  const { data, deleteIngredient } = useAppStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState<Ingredient | undefined>();
  const [editOpen, setEditOpen] = useState(false);

  const categories = uniqueCategories(data.ingredients);
  const usage = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of data.recipes) for (const it of r.items) m.set(it.ingredientId, (m.get(it.ingredientId) ?? 0) + 1);
    return m;
  }, [data.recipes]);

  const list = data.ingredients
    .filter((i) => !category || i.category.trim() === category)
    .filter((i) => normalize(i.name + " " + i.category).includes(normalize(search)))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const addButton = (
    <IngredientFormDialog
      trigger={
        <Button>
          <Plus /> Novo ingrediente
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader title="Ingredientes" description="Preços unitários e estoque usados em todos os cálculos." actions={addButton} />

      {data.ingredients.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum ingrediente cadastrado" description="Cadastre os ingredientes com os preços que você paga no servidor." action={addButton} />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar ingrediente" />
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
            <p className="py-10 text-center text-sm text-muted-foreground">Nenhum ingrediente encontrado.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((i, idx) => {
                const used = usage.get(i.id) ?? 0;
                return (
                  <div key={i.id} className="surface-card flex flex-col gap-3 p-4 animate-fade-up" style={{ animationDelay: `${Math.min(idx, 10) * 25}ms` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{i.name}</h3>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {i.category ? <Badge variant="secondary">{i.category}</Badge> : null}
                          <Badge variant="outline" className="text-muted-foreground">
                            {used === 0 ? "Sem receitas" : `${used} receita${used > 1 ? "s" : ""}`}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button size="icon" variant="ghost" aria-label={`Editar ${i.name}`} onClick={() => { setEditing(i); setEditOpen(true); }}>
                          <Pencil />
                        </Button>
                        <ConfirmButton
                          title={`Excluir "${i.name}"?`}
                          description={used > 0 ? `Ele será removido de ${used} receita(s).` : "Esta ação não pode ser desfeita."}
                          confirmLabel="Excluir"
                          onConfirm={() => { deleteIngredient(i.id); toast.success("Ingrediente excluído."); }}
                          trigger={
                            <Button size="icon" variant="ghost" aria-label={`Excluir ${i.name}`} className="hover:text-destructive">
                              <Trash2 />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-surface px-3 py-2">
                        <p className="text-xs text-muted-foreground">Preço unitário</p>
                        <p className="font-semibold tabular text-primary">{money(i.unitPrice)}</p>
                      </div>
                      <div className="rounded-lg bg-surface px-3 py-2">
                        <p className="text-xs text-muted-foreground">Estoque</p>
                        <p className="font-semibold tabular">{i.stock == null ? "—" : `${qty(i.stock)} un`}</p>
                      </div>
                    </div>
                    {i.packagePrice != null && i.packageUnits ? (
                      <p className="text-xs text-muted-foreground">
                        Pacote: {money(i.packagePrice)} com {qty(i.packageUnits)} unidades
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <IngredientFormDialog ingredient={editing} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

