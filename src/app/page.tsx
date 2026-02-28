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

const sections = [
  {
    href: "/free-space",
    icon: HardDrive,
    title: "Free Space Management",
    desc: "Visualize bitmap, linked list, grouping, and counting methods for tracking free disk blocks.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    href: "/directory",
    icon: FolderTree,
    title: "Directory Structure",
    desc: "Explore the hierarchical file tree, inode metadata, and directory entries.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    href: "/file-access",
    icon: FileSearch,
    title: "File Access Mechanisms",
    desc: "Compare contiguous, linked, and indexed allocation with animated block access.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    href: "/crash-recovery",
    icon: AlertTriangle,
    title: "Crash & Recovery",
    desc: "Simulate disk crashes, run fsck consistency checks, and recover corrupted blocks.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    href: "/optimization",
    icon: Gauge,
    title: "Optimization",
    desc: "Defragment the disk, benchmark allocation methods, and optimize read/write times.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
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
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold tracking-tight">
          File System Recovery &{" "}
          <span className="text-primary">Optimization</span>
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
          An interactive simulator for exploring how operating systems manage
          disk storage, recover from crashes, and optimize file access. Click
          any section below to dive in.
        </p>
      </motion.div>

      {/* Live stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            icon: Database,
            label: "Total Blocks",
            value: stats.totalBlocks,
            color: "text-blue-500",
          },
          {
            icon: Layers,
            label: "Used",
            value: `${stats.usedBlocks} (${usedPercent}%)`,
            color: "text-emerald-500",
          },
          {
            icon: HardDrive,
            label: "Free",
            value: stats.freeBlocks,
            color: "text-gray-500",
          },
          {
            icon: AlertTriangle,
            label: "Corrupted",
            value: stats.corruptedBlocks,
            color: "text-red-500",
          },
          {
            icon: FileText,
            label: "Files",
            value: fileCount,
            color: "text-purple-500",
          },
          {
            icon: FolderTree,
            label: "Directories",
            value: dirCount,
            color: "text-amber-500",
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.2 }}
          >
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-xs text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <p className="text-xl font-bold">{item.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Disk usage bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Disk Usage
              </span>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Used ({stats.usedBlocks})
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Corrupted ({stats.corruptedBlocks})
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700" />
                  Free ({stats.freeBlocks})
                </span>
              </div>
            </div>
            <div className="h-6 bg-muted rounded-full overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(stats.usedBlocks / stats.totalBlocks) * 100}%`,
                }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-emerald-500 h-full"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(stats.corruptedBlocks / stats.totalBlocks) * 100}%`,
                }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="bg-red-500 h-full"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>
                Fragmentation:{" "}
                <b className="text-foreground">
                  {stats.fragmentationPercent}%
                </b>
              </span>
              <span>
                Avg Seek:{" "}
                <b className="text-foreground">{stats.avgSeekTime}ms</b>
              </span>
              <span>
                Avg Transfer:{" "}
                <b className="text-foreground">{stats.avgTransferTime}ms</b>
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mini disk block map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-4 w-4" />
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
                    ? "bg-gray-200 dark:bg-gray-800"
                    : block.status === "corrupted"
                    ? "bg-red-500"
                    : block.status === "reserved"
                    ? "bg-amber-500/60"
                    : "bg-emerald-500/80";
                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 + i * 0.001 }}
                    className={`aspect-square rounded-[2px] ${color}`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Separator />

      {/* Section cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section, i) => (
          <motion.div
            key={section.href}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 + 0.9 }}
          >
            <Link href={section.href}>
              <Card className="group hover:shadow-md transition-all duration-300 hover:border-primary/30 cursor-pointer h-full">
                <CardHeader>
                  <div
                    className={`w-10 h-10 rounded-lg ${section.bg} flex items-center justify-center mb-2`}
                  >
                    <section.icon className={`h-5 w-5 ${section.color}`} />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {section.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Explore <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Educational footer */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">
                About This Simulator
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This tool simulates a simplified file system with 256 blocks of
                4KB each (1MB total). It demonstrates real OS concepts including
                free-space bitmap tracking, inode-based directory structures,
                contiguous/linked/indexed allocation, crash recovery via block
                repair, fsck consistency checking, and defragmentation
                optimization. All operations are performed in-memory for
                educational purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
