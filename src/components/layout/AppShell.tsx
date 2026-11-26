import { CloudPanel } from "@/components/CloudPanel";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAppStore } from "@/store/app-store";
import { AppSidebar } from "./AppSidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const { ready } = useAppStore();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur md:px-5">
          <SidebarTrigger aria-label="Abrir ou fechar menu" />
          <span className="font-display text-sm font-semibold md:hidden">Craft Food</span>
          <CloudPanel />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {ready ? (
            children
          ) : (
            <div className="grid min-h-[50vh] place-items-center text-muted-foreground">
              <Loader2 className="size-6 animate-spin" aria-label="Carregando" />
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
