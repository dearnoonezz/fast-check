import { Calculator, ChefHat, DatabaseBackup, LayoutDashboard, Package, ShoppingCart } from "lucide-react";

export const navItems = [
  { title: "Painel", url: "/", icon: LayoutDashboard, description: "Visão geral" },
  { title: "Ingredientes", url: "/ingredientes", icon: Package, description: "Preços e estoque" },
  { title: "Receitas", url: "/receitas", icon: ChefHat, description: "Custos e lucro" },
  { title: "Calculadora", url: "/calculadora", icon: Calculator, description: "Planeje a produção" },
  { title: "Lista de compras", url: "/lista-de-compras", icon: ShoppingCart, description: "O que comprar" },
  { title: "Backup", url: "/backup", icon: DatabaseBackup, description: "Exportar e importar" },
] as const;
