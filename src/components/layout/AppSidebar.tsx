import { Link, useRouterState } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/store/app-store";
import { navItems } from "./nav";

export function AppSidebar() {
  const { setOpenMobile, isMobile } = useSidebar();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useAppStore();
  const current = pathname;
  const isActive = (url: string) => (url === "/" ? current === "/" : current.startsWith(url));

  const badges: Record<string, number> = {
    "/ingredientes": data.ingredients.length,
    "/receitas": data.recipes.length,
    "/calculadora": data.plan.length,
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          to="/"
          onClick={() => isMobile && setOpenMobile(false)}
          className="flex items-center gap-3 rounded-lg px-1.5 py-2"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <UtensilsCrossed className="size-[18px]" />
          </span>
          <span className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-base font-semibold tracking-tight">Craft Food</span>
            <span className="text-xs text-muted-foreground">Calculadora de produção</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} onClick={() => isMobile && setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {badges[item.url] ? <SidebarMenuBadge>{badges[item.url]}</SidebarMenuBadge> : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="px-2 pb-1 text-[11px] leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
          Dados salvos apenas neste navegador.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
