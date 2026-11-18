import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  ChefHat,
  Coins,
  Layers,
  Percent,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/common/ConfirmButton";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { QuantityStepper } from "@/components/common/QuantityStepper";
import { SearchInput, normalize } from "@/components/common/SearchInput";
import { StatCard } from "@/components/common/StatCard";
import { computeProduction, recipeStats, toMap } from "@/lib/calc";
import { money, pct, qty } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export const Route = createFileRoute("/calculadora")({
  head: () => ({
    meta: [
      { title: "Calculadora de produção — Craft Food" },
      { name: "description", content: "Escolha os alimentos e veja ingredientes, custos, receita e lucro em tempo real." },
      { property: "og:title", content: "Calculadora de produção — Craft Food" },
      { property: "og:description", content: "Escolha os alimentos e veja ingredientes, custos, receita e lucro em tempo real." },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const { data, setPlanQuantity, clearPlan } = useAppStore();
  const [search, setSearch] = useState("");
  const result = useMemo(() => computeProduction(data), [data]);
  const map = useMemo(() => toMap(data.ingredients), [data.ingredients]);
  const planQty = (id: string) => data.plan.find((p) => p.recipeId === id)?.quantity ?? 0;

  if (data.recipes.length === 0) {
    return (
      <>
        <PageHeader title="Calculadora de produção" description="Planeje quanto fabricar e veja tudo calculado." />
        <EmptyState
          icon={Calculator}
          title="Crie uma receita para começar"
          description="A calculadora usa suas receitas e ingredientes cadastrados."
          action={<Button asChild><Link to="/receitas"><ChefHat /> Ir para receitas</Link></Button>}
        />
      </>
    );
  }

  const recipes = data.recipes
    .filter((r) => normalize(r.name + " " + r.category).includes(normalize(search)))
    .sort((a, b) => planQty(b.id) - planQty(a.id) || a.name.localeCompare(b.name, "pt-BR"));

  return (
    <>
      <PageHeader
        title="Calculadora de produção"
        description="Informe quantas unidades de cada alimento você quer. Tudo é recalculado na hora."
        actions={
          <>
            <ConfirmButton
              title="Limpar a produção planejada?"
              description="Todas as quantidades voltam a zero e as marcações da lista de compras são removidas."
              confirmLabel="Limpar"
              onConfirm={clearPlan}
              trigger={<Button variant="outline" disabled={data.plan.length === 0}><RotateCcw /> Limpar</Button>}
            />
            <Button asChild><Link to="/lista-de-compras"><ShoppingCart /> Lista de compras</Link></Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Custo total" value={money(result.totalCost)} icon={Wallet} hint={`${qty(result.totalCrafts)} fabricações`} />
        <StatCard label="Receita prevista" value={money(result.totalRevenue)} icon={Coins} tone="primary" hint={`${qty(result.totalProduced)} alimentos`} />
        <StatCard label="Lucro líquido" value={money(result.totalProfit)} icon={TrendingUp} tone={result.totalProfit < 0 ? "destructive" : "primary"} />
        <StatCard label="Margem de lucro" value={pct(result.margin)} icon={Percent} tone={result.margin < 0 ? "destructive" : "default"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <section className="surface-card flex flex-col p-4 md:p-5">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Alimentos</h2>
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar alimento" />
          </div>
          <ul className="divide-y">
            {recipes.map((r) => {
              const q = planQty(r.id);
              const stats = recipeStats(r, map);
              const crafts = q > 0 ? Math.ceil(q / r.yieldPerCraft) : 0;
              return (
                <li key={r.id} className={cn("flex items-center gap-3 py-3 transition-opacity", q === 0 && "opacity-80")}>
                  <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface text-muted-foreground">
                    {r.image ? <img src={r.image} alt="" className="size-full object-cover" /> : <ChefHat className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {money(stats.costPerUnit)} custo · {money(r.salePrice)} venda
                    </p>
                    {q > 0 ? (
                      <p className="text-xs text-primary">
                        {crafts} fabricaç{crafts > 1 ? "ões" : "ão"} → {qty(crafts * r.yieldPerCraft)} un
                      </p>
                    ) : null}
                  </div>
                  <QuantityStepper value={q} label={r.name} onChange={(v) => setPlanQuantity(r.id, v)} />
                </li>
              );
            })}
            {recipes.length === 0 ? <li className="py-6 text-center text-sm text-muted-foreground">Nenhum alimento encontrado.</li> : null}
          </ul>
        </section>

        <div className="grid content-start gap-6">
          {result.lines.length === 0 ? (
            <EmptyState icon={Layers} title="Nenhum alimento selecionado" description="Aumente a quantidade de algum alimento ao lado para ver os cálculos." />
          ) : (
            <>
              <section className="surface-card overflow-hidden">
                <h2 className="px-4 pt-4 text-lg font-semibold md:px-5">Custo por alimento</h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr className="border-b">
                        <th className="px-4 py-3 font-medium md:px-5">Alimento</th>
                        <th className="px-3 py-3 text-right font-medium">Produz</th>
                        <th className="px-3 py-3 text-right font-medium">Custo</th>
                        <th className="px-3 py-3 text-right font-medium">Receita</th>
                        <th className="px-4 py-3 text-right font-medium md:px-5">Lucro</th>
                      </tr>
                    </thead>
                    <tbody className="tabular">
                      {result.lines.map((l) => (
                        <tr key={l.recipe.id} className="border-b last:border-0">
                          <td className="px-4 py-3 md:px-5">
                            <p className="font-medium">{l.recipe.name}</p>
                            <p className="text-xs text-muted-foreground">{l.crafts}× fabricação</p>
                          </td>
                          <td className="px-3 py-3 text-right">
                            {qty(l.produced)}
                            {l.produced > l.desired ? <p className="text-xs text-muted-foreground">pediu {qty(l.desired)}</p> : null}
                          </td>
                          <td className="px-3 py-3 text-right">{money(l.cost)}</td>
                          <td className="px-3 py-3 text-right">{money(l.revenue)}</td>
                          <td className={cn("px-4 py-3 text-right font-semibold md:px-5", l.profit < 0 ? "text-destructive" : "text-primary")}>
                            {money(l.profit)}
                            <p className="text-xs font-normal text-muted-foreground">{pct(l.margin)}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="surface-card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 md:px-5">
                  <h2 className="text-lg font-semibold">Ingredientes necessários</h2>
                  {result.missingCount > 0 ? (
                    <Badge className="gap-1 bg-warning/15 text-warning hover:bg-warning/15">
                      <AlertTriangle className="size-3" /> {result.missingCount} faltando · {money(result.shoppingCost)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Estoque suficiente</Badge>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr className="border-b">
                        <th className="px-4 py-3 font-medium md:px-5">Ingrediente</th>
                        <th className="px-3 py-3 text-right font-medium">Necessário</th>
                        <th className="px-3 py-3 text-right font-medium">Estoque</th>
                        <th className="px-3 py-3 text-right font-medium">Faltando</th>
                        <th className="px-4 py-3 text-right font-medium md:px-5">Custo</th>
                      </tr>
                    </thead>
                    <tbody className="tabular">
                      {result.needs.map((n) => (
                        <tr key={n.ingredient.id} className="border-b last:border-0">
                          <td className="px-4 py-3 md:px-5">
                            <p className="font-medium">{n.ingredient.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {n.usedBy.length > 1 ? <span className="text-accent-foreground">Comum a {n.usedBy.length}: </span> : null}
                              {n.usedBy.join(", ")}
                            </p>
                          </td>
                          <td className="px-3 py-3 text-right">{qty(n.needed)}</td>
                          <td className="px-3 py-3 text-right text-muted-foreground">{n.stock == null ? "—" : qty(n.stock)}</td>
                          <td className={cn("px-3 py-3 text-right", n.missing > 0 ? "font-semibold text-warning" : "text-muted-foreground")}>
                            {n.missing > 0 ? qty(n.missing) : "0"}
                          </td>
                          <td className="px-4 py-3 text-right md:px-5">
                            {money(n.cost)}
                            <p className="text-xs text-muted-foreground">{money(n.ingredient.unitPrice)}/un</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-surface font-semibold">
                        <td className="px-4 py-3 md:px-5" colSpan={4}>Custo total da produção</td>
                        <td className="px-4 py-3 text-right tabular md:px-5">{money(result.totalCost)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="px-4 py-3 text-xs text-muted-foreground md:px-5">
                  "—" no estoque indica ingrediente sem controle de estoque: toda a quantidade entra como faltante.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
