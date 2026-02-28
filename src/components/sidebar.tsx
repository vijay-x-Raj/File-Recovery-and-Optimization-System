"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  HardDrive,
  FolderTree,
  FileSearch,
  AlertTriangle,
  Gauge,
  Menu,
  X,
  RotateCcw,
} from "lucide-react";
import { useSimulator } from "@/lib/context";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, color: "text-cyan-400" },
  { href: "/free-space", label: "Free Space", icon: HardDrive, color: "text-blue-400" },
  { href: "/directory", label: "Directory", icon: FolderTree, color: "text-amber-400" },
  { href: "/file-access", label: "File Access", icon: FileSearch, color: "text-purple-400" },
  { href: "/crash-recovery", label: "Crash & Recovery", icon: AlertTriangle, color: "text-red-400" },
  { href: "/optimization", label: "Optimization", icon: Gauge, color: "text-emerald-400" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { reset } = useSimulator();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden backdrop-blur-md bg-card/50 border border-border/50"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 border-r border-border/50 bg-sidebar transition-transform duration-300 ease-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full relative">
          {/* Subtle gradient overlay at top */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-border/50 relative">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
              <div className="relative w-9 h-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                <HardDrive className="h-4.5 w-4.5 text-primary" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground">
                FS Recovery
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                Simulator
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest px-3 mb-2">
              Navigation
            </p>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-primary/[0.08] border border-primary/20"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <item.icon className={cn("h-4 w-4 relative z-10", active ? item.color : "")} />
                  <span className="relative z-10">{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="sidebar-dot"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Reset */}
          <div className="px-3 py-4 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-red-400 transition-colors h-9"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Reset Simulator</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
