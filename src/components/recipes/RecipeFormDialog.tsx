import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryInput, uniqueCategories } from "@/components/common/CategoryInput";
import { NumberInput } from "@/components/common/NumberInput";
import { recipeStats, toMap } from "@/lib/calc";
import { money, pct } from "@/lib/format";
import { newId } from "@/lib/id";
import { fileToThumbnail } from "@/lib/image";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

interface Row {
  key: string;
  ingredientId: string;
  quantity: number | null;
}

interface FormState {
  name: string;
  category: string;
  image: string | null;
  yieldPerCraft: number | null;
  salePrice: number | null;
  rows: Row[];
}

const fromRecipe = (r?: Recipe): FormState => ({
  name: r?.name ?? "",
  category: r?.category ?? "",
  image: r?.image ?? null,
  yieldPerCraft: r?.yieldPerCraft ?? 1,
  salePrice: r?.salePrice ?? null,
  rows: r?.items.length
    ? r.items.map((it) => ({ key: newId(), ingredientId: it.ingredientId, quantity: it.quantity }))
    : [{ key: newId(), ingredientId: "", quantity: 1 }],
});

export function RecipeFormDialog({
  recipe,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  recipe?: Recipe | undefined;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { data, upsertRecipe } = useAppStore();
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const [form, setForm] = useState<FormState>(() => fromRecipe(recipe));
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setForm(fromRecipe(recipe));
  }, [open, recipe]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setRow = (key: string, patch: Partial<Row>) =>
    setForm((f) => ({ ...f, rows: f.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));

  const map = toMap(data.ingredients);
  const ingredientsSorted = [...data.ingredients].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const validItems = form.rows
    .filter((r) => r.ingredientId && map.has(r.ingredientId) && (r.quantity ?? 0) > 0)
    .map((r) => ({ ingredientId: r.ingredientId, quantity: r.quantity as number }));
  const preview = recipeStats(
    {
      id: "preview",
      name: form.name,
      category: form.category,
      items: validItems,
      yieldPerCraft: form.yieldPerCraft && form.yieldPerCraft > 0 ? form.yieldPerCraft : 1,
      salePrice: form.salePrice ?? 0,
    },
    map,
  );

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      set("image", await fileToThumbnail(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível usar a imagem.");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error("Informe o nome do alimento.");
      return;
    }
    if (!form.yieldPerCraft || form.yieldPerCraft < 1 || !Number.isInteger(form.yieldPerCraft))
      {
      toast.error("A quantidade produzida por fabricação deve ser um número inteiro maior que zero.");
      return;
    }
    if (form.salePrice == null || form.salePrice < 0) {
      toast.error("Informe o preço de venda unitário.");
      return;
    }
    if (validItems.length === 0) {
      toast.error("Adicione pelo menos um ingrediente com quantidade.");
      return;
    }
    const ids = validItems.map((i) => i.ingredientId);
    if (new Set(ids).size !== ids.length) {
      toast.error("Há ingredientes repetidos na receita.");
      return;
    }

    upsertRecipe({
      id: recipe?.id ?? newId(),
      name,
      category: form.category.trim(),
      image: form.image,
      yieldPerCraft: form.yieldPerCraft,
      salePrice: form.salePrice,
      items: validItems,
    });
    toast.success(recipe ? "Receita atualizada." : "Receita criada.");
    setOpen(false);
  };

  const usedIds = new Set(form.rows.map((r) => r.ingredientId));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{recipe ? "Editar receita" : "Nova receita"}</DialogTitle>
            <DialogDescription>Os custos são calculados com os preços atuais dos ingredientes.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
            <div className="grid gap-2">
              <Label>Imagem</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl border border-dashed bg-surface text-muted-foreground transition-colors hover:border-primary hover:text-primary sm:w-[120px]"
                  aria-label="Escolher imagem"
                >
                  {form.image ? (
                    <img src={form.image} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-xs">
                      <ImagePlus className="size-5" /> Opcional
                    </span>
                  )}
                </button>
                {form.image ? (
                  <Button type="button" size="icon" variant="secondary" className="absolute right-1.5 top-1.5 size-7" aria-label="Remover imagem" onClick={() => set("image", null)}>
                    <X />
                  </Button>
                ) : null}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
              </div>
            </div>
            <div className="grid content-start gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rec-name">Nome do alimento</Label>
                <Input id="rec-name" autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome do alimento" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rec-cat">Categoria</Label>
                <CategoryInput id="rec-cat" value={form.category} onChange={(v) => set("category", v)} suggestions={uniqueCategories(data.recipes)} placeholder="Ex.: Lanches, Bebidas" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="rec-yield">Produz por fabricação</Label>
              <NumberInput id="rec-yield" value={form.yieldPerCraft} onValueChange={(v) => set("yieldPerCraft", v)} placeholder="1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rec-price">Preço de venda (unidade)</Label>
              <NumberInput id="rec-price" prefix="$" value={form.salePrice} onValueChange={(v) => set("salePrice", v)} placeholder="0,00" />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Ingredientes por fabricação</Label>
              <Button type="button" size="sm" variant="outline" disabled={data.ingredients.length === 0} onClick={() => set("rows", [...form.rows, { key: newId(), ingredientId: "", quantity: 1 }])}>
                <Plus /> Adicionar
              </Button>
            </div>
            {data.ingredients.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                Cadastre ingredientes primeiro em{" "}
                <Link to="/ingredientes" className="text-primary underline-offset-4 hover:underline" onClick={() => setOpen(false)}>
                  Ingredientes
                </Link>
                .
              </p>
            ) : (
              <div className="grid gap-2">
                {form.rows.map((row) => {
                  const ing = map.get(row.ingredientId);
                  const lineCost = ing ? ing.unitPrice * (row.quantity ?? 0) : 0;
                  return (
                    <div key={row.key} className="grid grid-cols-[1fr_88px_auto] items-center gap-2 sm:grid-cols-[1fr_100px_100px_auto]">
                      <Select value={row.ingredientId} onValueChange={(v) => setRow(row.key, { ingredientId: v })}>
                        <SelectTrigger aria-label="Ingrediente">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredientsSorted.map((i) => (
                            <SelectItem key={i.id} value={i.id} disabled={usedIds.has(i.id) && i.id !== row.ingredientId}>
                              {i.name} <span className="text-muted-foreground">· {money(i.unitPrice)}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <NumberInput value={row.quantity} onValueChange={(v) => setRow(row.key, { quantity: v })} placeholder="Qtd." aria-label="Quantidade" />
                      <span className="hidden text-right text-sm tabular text-muted-foreground sm:block">{money(lineCost)}</span>
                      <Button type="button" size="icon" variant="ghost" aria-label="Remover ingrediente" className="hover:text-destructive" onClick={() => set("rows", form.rows.filter((r) => r.key !== row.key))}>
                        <Trash2 />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl border bg-surface p-3 text-sm sm:grid-cols-4">
            <PreviewStat label="Custo / fabricação" value={money(preview.costPerCraft)} />
            <PreviewStat label="Custo / unidade" value={money(preview.costPerUnit)} />
            <PreviewStat label="Lucro / unidade" value={money(preview.profitPerUnit)} tone={preview.profitPerUnit < 0 ? "bad" : "good"} />
            <PreviewStat label="Margem" value={pct(preview.margin)} tone={preview.margin < 0 ? "bad" : "good"} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">{recipe ? "Salvar alterações" : "Criar receita"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PreviewStat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-semibold tabular", tone === "good" && "text-primary", tone === "bad" && "text-destructive")}>{value}</p>
    </div>
  );
}
