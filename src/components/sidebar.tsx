"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/free-space", label: "Free Space Management", icon: HardDrive },
  { href: "/directory", label: "Directory Structure", icon: FolderTree },
  { href: "/file-access", label: "File Access", icon: FileSearch },
  { href: "/crash-recovery", label: "Crash & Recovery", icon: AlertTriangle },
  { href: "/optimization", label: "Optimization", icon: Gauge },
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
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 border-r border-border bg-card transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
            <HardDrive className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg tracking-tight">
              FS Recovery
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Reset */}
          <div className="px-3 py-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset Simulator
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
