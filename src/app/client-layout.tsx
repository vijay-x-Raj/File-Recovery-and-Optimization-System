"use client";

import { SimulatorProvider } from "@/lib/context";
import { Sidebar } from "@/components/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SimulatorProvider>
      <TooltipProvider>
        <Sidebar />
        <main className="lg:ml-64 min-h-screen bg-background bg-dot-grid relative">
          {/* Subtle radial glow behind content */}
          <div className="fixed inset-0 lg:left-64 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 lg:pt-8">
            {children}
          </div>
        </main>
      </TooltipProvider>
    </SimulatorProvider>
  );
}
