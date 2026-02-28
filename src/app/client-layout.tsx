"use client";

import { SimulatorProvider } from "@/lib/context";
import { Sidebar } from "@/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SimulatorProvider>
      <TooltipProvider>
        <Sidebar />
        <main className="lg:ml-64 min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">
            {children}
          </div>
        </main>
      </TooltipProvider>
    </SimulatorProvider>
  );
}
