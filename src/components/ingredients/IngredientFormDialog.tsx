import { useEffect, useState, type ReactNode } from "react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CategoryInput, uniqueCategories } from "@/components/common/CategoryInput";
import { NumberInput } from "@/components/common/NumberInput";
import { unitPriceFromPackage } from "@/lib/calc";
import { money } from "@/lib/format";
import { newId } from "@/lib/id";
import type { Ingredient } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

interface FormState {
  name: string;
  category: string;
  usePackage: boolean;
  unitPrice: number | null;
  packagePrice: number | null;
  packageUnits: number | null;
  stock: number | null;
}

const fromIngredient = (i?: Ingredient): FormState => ({
  name: i?.name ?? "",
  category: i?.category ?? "",
  usePackage: !!(i?.packagePrice != null && i?.packageUnits),
  unitPrice: i?.unitPrice ?? null,
  packagePrice: i?.packagePrice ?? null,
  packageUnits: i?.packageUnits ?? null,
  stock: i?.stock ?? null,
});

export function IngredientFormDialog({
  ingredient,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  ingredient?: Ingredient | undefined;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { data, upsertIngredient } = useAppStore();
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;
  const [form, setForm] = useState<FormState>(() => fromIngredient(ingredient));

  useEffect(() => {
    if (open) setForm(fromIngredient(ingredient));
  }, [open, ingredient]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const computedUnit = form.usePackage
    ? unitPriceFromPackage(form.packagePrice ?? 0, form.packageUnits ?? 0)
    : (form.unitPrice ?? 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error("Informe o nome do ingrediente.");
      return;
    }
    const duplicate = data.ingredients.some(
      (i) => i.id !== ingredient?.id && i.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      toast.error("Já existe um ingrediente com esse nome.");
      return;
    }
    if (form.usePackage) {
      if (form.packagePrice == null || form.packagePrice < 0) {
      toast.error("Informe o preço do pacote.");
      return;
    }
      if (!form.packageUnits || form.packageUnits <= 0)
        {
      toast.error("Informe quantas unidades o pacote contém.");
      return;
    }
    } else if (form.unitPrice == null || form.unitPrice < 0) {
      {
      toast.error("Informe o preço unitário.");
      return;
    }
    }
    if (form.stock != null && form.stock < 0) {
      toast.error("O estoque não pode ser negativo.");
      return;
    }

    upsertIngredient({
      id: ingredient?.id ?? newId(),
      name,
      category: form.category.trim(),
      unitPrice: computedUnit,
      stock: form.stock,
      packagePrice: form.usePackage ? form.packagePrice : null,
      packageUnits: form.usePackage ? form.packageUnits : null,
    });
    toast.success(ingredient ? "Ingrediente atualizado." : "Ingrediente cadastrado.");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{ingredient ? "Editar ingrediente" : "Novo ingrediente"}</DialogTitle>
            <DialogDescription>
              Alterar o preço atualiza o custo de todas as receitas que usam este ingrediente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="ing-name">Nome</Label>
            <Input id="ing-name" autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome do ingrediente" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ing-cat">Categoria</Label>
            <CategoryInput id="ing-cat" value={form.category} onChange={(v) => set("category", v)} suggestions={uniqueCategories(data.ingredients)} placeholder="Ex.: Grãos, Laticínios" />
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-surface px-3 py-2.5">
            <div>
              <Label htmlFor="ing-pack" className="cursor-pointer">Comprar em pacote</Label>
              <p className="text-xs text-muted-foreground">Calcula o preço unitário a partir do pacote.</p>
            </div>
            <Switch id="ing-pack" checked={form.usePackage} onCheckedChange={(v) => set("usePackage", v)} />
          </div>

          {form.usePackage ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="ing-pp">Preço do pacote</Label>
                <NumberInput id="ing-pp" prefix="$" value={form.packagePrice} onValueChange={(v) => set("packagePrice", v)} placeholder="0,00" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ing-pu">Unidades no pacote</Label>
                <NumberInput id="ing-pu" value={form.packageUnits} onValueChange={(v) => set("packageUnits", v)} placeholder="0" />
              </div>
              <p className="col-span-2 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
                Preço unitário: <strong className="tabular">{money(computedUnit)}</strong>
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="ing-up">Preço unitário</Label>
              <NumberInput id="ing-up" prefix="$" value={form.unitPrice} onValueChange={(v) => set("unitPrice", v)} placeholder="0,00" />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="ing-stock">
              Estoque <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <NumberInput id="ing-stock" value={form.stock} onValueChange={(v) => set("stock", v)} placeholder="Deixe vazio para não controlar" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">{ingredient ? "Salvar alterações" : "Cadastrar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
