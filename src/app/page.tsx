"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSimulator } from "@/lib/context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  HardDrive,
  FolderTree,
  FileSearch,
  AlertTriangle,
  Gauge,
  ArrowRight,
  Layers,
  FileText,
  Database,
  Activity,
  Shield,
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const sections = [
  {
    href: "/free-space",
    icon: HardDrive,
    title: "Free Space Management",
    desc: "Visualize bitmap, linked list, grouping, and counting methods for tracking free disk blocks.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    glow: "group-hover:shadow-blue-500/10",
  },
  {
    href: "/directory",
    icon: FolderTree,
    title: "Directory Structure",
    desc: "Explore the hierarchical file tree, inode metadata, and directory entries.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    glow: "group-hover:shadow-amber-500/10",
  },
  {
    href: "/file-access",
    icon: FileSearch,
    title: "File Access Mechanisms",
    desc: "Compare contiguous, linked, and indexed allocation with animated block access.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    glow: "group-hover:shadow-purple-500/10",
  },
  {
    href: "/crash-recovery",
    icon: AlertTriangle,
    title: "Crash & Recovery",
    desc: "Simulate disk crashes, run fsck consistency checks, and recover corrupted blocks.",
    color: "text-red-400",
    bg: "bg-red-500/10",
    glow: "group-hover:shadow-red-500/10",
  },
  {
    href: "/optimization",
    icon: Gauge,
    title: "Optimization",
    desc: "Defragment the disk, benchmark allocation methods, and optimize read/write times.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    glow: "group-hover:shadow-emerald-500/10",
  },
];

export default function DashboardPage() {
  const { simulator, tick } = useSimulator();

  const stats = useMemo(() => simulator.getStats(), [simulator, tick]);
  const fileCount = useMemo(
    () => Array.from(simulator.files.values()).filter((f) => !f.isDirectory).length,
    [simulator, tick]
  );
  const dirCount = useMemo(
    () => Array.from(simulator.files.values()).filter((f) => f.isDirectory).length,
    [simulator, tick]
  );

  const usedPercent = Math.round((stats.usedBlocks / stats.totalBlocks) * 100);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Hero */}
      <motion.div variants={fadeUp}>
        <h1 className="text-4xl font-bold tracking-tight">
          File System Recovery &{" "}
          <span className="text-gradient">Optimization</span>
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-lg leading-relaxed">
          An interactive simulator for exploring how operating systems manage
          disk storage, recover from crashes, and optimize file access.
        </p>
      </motion.div>

      {/* Live stats overview */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            icon: Database,
            label: "Total Blocks",
            value: stats.totalBlocks,
            color: "text-blue-400",
            border: "border-blue-500/10",
          },
          {
            icon: Layers,
            label: "Used",
            value: `${stats.usedBlocks} (${usedPercent}%)`,
            color: "text-emerald-400",
            border: "border-emerald-500/10",
          },
          {
            icon: HardDrive,
            label: "Free",
            value: stats.freeBlocks,
            color: "text-slate-400",
            border: "border-slate-500/10",
          },
          {
            icon: AlertTriangle,
            label: "Corrupted",
            value: stats.corruptedBlocks,
            color: "text-red-400",
            border: "border-red-500/10",
          },
          {
            icon: FileText,
            label: "Files",
            value: fileCount,
            color: "text-purple-400",
            border: "border-purple-500/10",
          },
          {
            icon: FolderTree,
            label: "Directories",
            value: dirCount,
            color: "text-amber-400",
            border: "border-amber-500/10",
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            variants={fadeUp}
          >
            <Card className={`card-hover glass ${item.border}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                    {item.label}
                  </span>
                </div>
                <p className="text-xl font-bold tabular-nums">{item.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Disk usage bar */}
      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Disk Usage
              </span>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Used ({stats.usedBlocks})
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  Corrupted ({stats.corruptedBlocks})
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  Free ({stats.freeBlocks})
                </span>
              </div>
            </div>
            <div className="h-5 bg-muted/50 rounded-full overflow-hidden flex border border-border/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(stats.usedBlocks / stats.totalBlocks) * 100}%`,
                }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(stats.corruptedBlocks / stats.totalBlocks) * 100}%`,
                }}
                transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-gradient-to-r from-red-500 to-red-400 h-full"
              />
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>
                Fragmentation:{" "}
                <b className="text-foreground font-semibold">
                  {stats.fragmentationPercent}%
                </b>
              </span>
              <span>
                Avg Seek:{" "}
                <b className="text-foreground font-semibold">{stats.avgSeekTime}ms</b>
              </span>
              <span>
                Avg Transfer:{" "}
                <b className="text-foreground font-semibold">{stats.avgTransferTime}ms</b>
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mini disk block map */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Live Disk Block Map
            </CardTitle>
            <CardDescription>
              {stats.totalBlocks} blocks — each cell represents one disk block
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="grid gap-[2px]"
              style={{ gridTemplateColumns: "repeat(32, 1fr)" }}
            >
              {simulator.blocks.map((block, i) => {
                const color =
                  block.status === "free"
                    ? "bg-muted/40"
                    : block.status === "corrupted"
                    ? "bg-red-500"
                    : block.status === "reserved"
                    ? "bg-amber-500/60"
                    : "bg-emerald-500/70";
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.001, duration: 0.3 }}
                    className={`aspect-square rounded-sm ${color}`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator className="opacity-50" />

      {/* Section cards */}
      <motion.div variants={fadeUp} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section, i) => (
          <motion.div
            key={section.href}
            variants={fadeUp}
          >
            <Link href={section.href}>
              <Card className={`group card-hover cursor-pointer h-full ${section.glow} hover:shadow-lg`}>
                <CardHeader>
                  <div
                    className={`w-10 h-10 rounded-xl ${section.bg} flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <section.icon className={`h-5 w-5 ${section.color}`} />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {section.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2.5 transition-all duration-300">
                    Explore <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Educational footer */}
      <motion.div variants={fadeUp}>
        <Card className="bg-primary/[0.04] border-primary/10">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  About This Simulator
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  This tool simulates a simplified file system with 256 blocks of
                  4KB each (1MB total). It demonstrates real OS concepts including
                  free-space bitmap tracking, inode-based directory structures,
                  contiguous/linked/indexed allocation, crash recovery via block
                  repair, fsck consistency checking, and defragmentation
                  optimization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
