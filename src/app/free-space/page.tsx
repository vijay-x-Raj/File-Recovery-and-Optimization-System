"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulator } from "@/lib/context";
import type { FreeSpaceMethod } from "@/lib/fs-simulator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Info } from "lucide-react";

const methodInfo: Record<FreeSpaceMethod, { title: string; desc: string }> = {
  bitmap: {
    title: "Bitmap / Bit Vector",
    desc: "Each block is represented by a single bit (0 = used, 1 = free). Very space-efficient and allows fast lookup of contiguous free blocks using bitwise operations.",
  },
  "linked-list": {
    title: "Linked Free-Space List",
    desc: "All free blocks are linked together. The first free block contains a pointer to the next free block, forming a chain. Simple but traversal can be slow.",
  },
  grouping: {
    title: "Grouping",
    desc: "Free blocks are organized into groups. The first block of each group stores addresses of blocks in that group plus a pointer to the next group.",
  },
  counting: {
    title: "Counting",
    desc: "Instead of listing individual free blocks, stores the address of the first free block and the count of contiguous free blocks following it. Very efficient for large contiguous free areas.",
  },
};

export default function FreeSpacePage() {
  const { simulator, tick, refresh } = useSimulator();
  const [method, setMethod] = useState<FreeSpaceMethod>("bitmap");
  const [newFileSize, setNewFileSize] = useState([4]);
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);

  const stats = useMemo(() => simulator.getStats(), [simulator, tick]);
  const bitmap = useMemo(() => simulator.getBitmap(), [simulator, tick]);
  const linkedList = useMemo(
    () => simulator.getFreeBlocksLinkedList(),
    [simulator, tick]
  );
  const groups = useMemo(
    () => simulator.getFreeBlocksGrouping(),
    [simulator, tick]
  );
  const counting = useMemo(
    () => simulator.getFreeBlocksCounting(),
    [simulator, tick]
  );

  const handleCreateFile = () => {
    const name = `file_${Date.now().toString(36)}.dat`;
    simulator.createFile(name, newFileSize[0], "root", "linked");
    refresh();
  };

  const handleDeleteRandom = () => {
    const files = Array.from(simulator.files.values()).filter(
      (f) => !f.isDirectory
    );
    if (files.length > 0) {
      const target = files[Math.floor(Math.random() * files.length)];
      simulator.deleteFile(target.id);
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Free Space <span className="text-gradient">Management</span>
        </h1>
        <p className="text-muted-foreground mt-1 leading-relaxed">
          Visualize how the OS tracks available disk blocks using different
          strategies
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Blocks", value: stats.totalBlocks, color: "bg-blue-400", border: "border-blue-500/10" },
          { label: "Used", value: stats.usedBlocks, color: "bg-emerald-400", border: "border-emerald-500/10" },
          { label: "Free", value: stats.freeBlocks, color: "bg-slate-400", border: "border-slate-500/10" },
          { label: "Corrupted", value: stats.corruptedBlocks, color: "bg-red-400", border: "border-red-500/10" },
        ].map((s) => (
          <Card key={s.label} className={`card-hover glass ${s.border}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-2xl font-bold mt-1 tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                New file size:
              </span>
              <Slider
                value={newFileSize}
                onValueChange={setNewFileSize}
                max={20}
                min={1}
                step={1}
                className="flex-1"
              />
              <Badge variant="secondary">{newFileSize[0]} blocks</Badge>
            </div>
            <Button onClick={handleCreateFile} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Allocate File
            </Button>
            <Button
              onClick={handleDeleteRandom}
              size="sm"
              variant="destructive"
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" /> Delete Random
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Method tabs */}
      <Tabs
        value={method}
        onValueChange={(v) => setMethod(v as FreeSpaceMethod)}
      >
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="bitmap">Bitmap</TabsTrigger>
          <TabsTrigger value="linked-list">Linked List</TabsTrigger>
          <TabsTrigger value="grouping">Grouping</TabsTrigger>
          <TabsTrigger value="counting">Counting</TabsTrigger>
        </TabsList>

        {/* Info card */}
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-4 w-4 text-blue-500" />
              {methodInfo[method].title}
            </CardTitle>
            <CardDescription>{methodInfo[method].desc}</CardDescription>
          </CardHeader>
        </Card>

        {/* -------- BITMAP -------- */}
        <TabsContent value="bitmap" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bit Vector Visualization</CardTitle>
              <CardDescription>
                Each cell = 1 block. Green = free (1), Dark = used (0), Red =
                corrupted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(32, 1fr)" }}>
                <AnimatePresence mode="popLayout">
                  {simulator.blocks.map((block, i) => {
                    const color =
                      block.status === "free"
                        ? "bg-emerald-400/70"
                        : block.status === "corrupted"
                        ? "bg-red-500"
                        : block.status === "reserved"
                        ? "bg-amber-500/60"
                        : "bg-muted-foreground/25";
                    return (
                      <Tooltip key={block.id}>
                        <TooltipTrigger asChild>
                          <motion.div
                            layout
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.15, delay: i * 0.0008 }}
                            className={`aspect-square rounded-sm cursor-pointer transition-all duration-150 ${color} ${
                              hoveredBlock === i
                                ? "ring-2 ring-primary scale-125 z-10"
                                : "hover:scale-110 hover:brightness-125"
                            }`}
                            onMouseEnter={() => setHoveredBlock(i)}
                            onMouseLeave={() => setHoveredBlock(null)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-mono text-xs">
                            Block {i}: {block.status}{" "}
                            {block.fileId
                              ? `(${simulator.files.get(block.fileId)?.name || "?"})`
                              : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Bit value: {bitmap[i] ? "1 (free)" : "0 (used)"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </AnimatePresence>
              </div>
              {/* Binary string preview */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1 font-medium">
                  Bitmap binary string (first 64 blocks):
                </p>
                <p className="font-mono text-xs break-all leading-relaxed">
                  {bitmap.slice(0, 64).map((b, i) => (
                    <span
                      key={i}
                      className={
                        b ? "text-emerald-600 font-bold" : "text-muted-foreground"
                      }
                    >
                      {b ? "1" : "0"}
                      {(i + 1) % 8 === 0 ? " " : ""}
                    </span>
                  ))}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------- LINKED LIST -------- */}
        <TabsContent value="linked-list" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Linked List of Free Blocks</CardTitle>
              <CardDescription>
                Free blocks form a chain—each points to the next free block
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-1">
                {linkedList.slice(0, 80).map((blockId, i) => (
                  <React.Fragment key={blockId}>
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-center"
                    >
                      <div className="bg-emerald-500/20 border border-emerald-500/40 rounded px-2 py-1 text-xs font-mono">
                        {blockId}
                      </div>
                      {i < Math.min(linkedList.length, 80) - 1 && (
                        <svg
                          width="20"
                          height="12"
                          className="text-muted-foreground"
                        >
                          <line
                            x1="0"
                            y1="6"
                            x2="14"
                            y2="6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <polygon
                            points="14,2 20,6 14,10"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                    </motion.div>
                  </React.Fragment>
                ))}
                {linkedList.length > 80 && (
                  <Badge variant="outline" className="ml-2">
                    +{linkedList.length - 80} more
                  </Badge>
                )}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Total free blocks in chain:{" "}
                <span className="font-semibold text-foreground">
                  {linkedList.length}
                </span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------- GROUPING -------- */}
        <TabsContent value="grouping" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Grouped Free Blocks</CardTitle>
              <CardDescription>
                Free blocks organized into groups of up to 8. The first block of
                each group indexes the rest.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groups.map((group, gi) => (
                  <motion.div
                    key={gi}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: gi * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <Badge
                      variant="outline"
                      className="min-w-[70px] justify-center"
                    >
                      Group {gi + 1}
                    </Badge>
                    <div className="flex items-center gap-1 flex-wrap">
                      {group.map((blockId, bi) => (
                        <div
                          key={blockId}
                          className={`px-2 py-1 rounded text-xs font-mono ${
                            bi === 0
                              ? "bg-blue-500/20 border border-blue-500/40 font-bold"
                              : "bg-emerald-500/10 border border-emerald-500/30"
                          }`}
                        >
                          {blockId}
                          {bi === 0 && (
                            <span className="ml-1 text-[10px] text-blue-500">
                              (idx)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {gi < groups.length - 1 && (
                      <svg
                        width="24"
                        height="12"
                        className="text-muted-foreground shrink-0"
                      >
                        <line
                          x1="0"
                          y1="6"
                          x2="18"
                          y2="6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <polygon
                          points="18,2 24,6 18,10"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------- COUNTING -------- */}
        <TabsContent value="counting" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Counting (Run-Length)</CardTitle>
              <CardDescription>
                Each entry stores a starting block and the count of contiguous
                free blocks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {counting.map((run, ri) => (
                  <motion.div
                    key={ri}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: ri * 0.06 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-muted rounded-lg p-2 min-w-[140px]">
                        <p className="text-xs text-muted-foreground">
                          Start Block
                        </p>
                        <p className="font-mono font-bold">{run.start}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2 min-w-[100px]">
                        <p className="text-xs text-muted-foreground">Count</p>
                        <p className="font-mono font-bold">{run.count}</p>
                      </div>
                      {/* Visual bar */}
                      <div className="flex-1">
                        <div className="h-6 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(100, (run.count / 20) * 100)}%`,
                            }}
                            transition={{ delay: ri * 0.06 + 0.1, duration: 0.4 }}
                            className="h-full bg-emerald-500/60 rounded-full"
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Blocks {run.start}–{run.start + run.count - 1}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
