"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulator } from "@/lib/context";
import type { AllocationMethod, AccessLog } from "@/lib/fs-simulator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  BookOpen,
  PenTool,
  Trash2,
  Clock,
  Activity,
  ArrowRight,
  Info,
} from "lucide-react";

const allocationInfo: Record<AllocationMethod, { title: string; desc: string; pros: string[]; cons: string[] }> = {
  contiguous: {
    title: "Contiguous Allocation",
    desc: "Each file occupies a set of contiguous blocks on disk. The directory entry stores the start block and length.",
    pros: ["Fast sequential access", "Simple implementation", "Minimal seek time"],
    cons: ["External fragmentation", "File size must be known at creation", "Difficult to grow files"],
  },
  linked: {
    title: "Linked Allocation",
    desc: "Each file is a linked list of blocks. Each block contains a pointer to the next block.",
    pros: ["No external fragmentation", "Files can grow dynamically", "Simple allocation"],
    cons: ["Random access is slow (must traverse list)", "Pointer overhead per block", "Reliability issues if pointer corrupted"],
  },
  indexed: {
    title: "Indexed Allocation",
    desc: "An index block stores an array of pointers to all data blocks. Supports direct access without external fragmentation.",
    pros: ["Supports direct access", "No external fragmentation", "Files can grow easily"],
    cons: ["Index block overhead", "Max file size limited by index block", "Wasted space for small files"],
  },
};

export default function FileAccessPage() {
  const { simulator, tick, refresh } = useSimulator();
  const [method, setMethod] = useState<AllocationMethod>("contiguous");
  const [fileSize, setFileSize] = useState([5]);
  const [selectedLog, setSelectedLog] = useState<AccessLog | null>(null);
  const [animatingBlocks, setAnimatingBlocks] = useState<number[]>([]);

  const files = useMemo(
    () => Array.from(simulator.files.values()).filter((f) => !f.isDirectory),
    [simulator, tick]
  );

  const logs = useMemo(
    () => [...simulator.accessLog].reverse().slice(0, 50),
    [simulator, tick]
  );

  const handleCreate = () => {
    const name = `${method}_${Date.now().toString(36)}.dat`;
    simulator.createFile(name, fileSize[0], "root", method);
    refresh();
  };

  const handleRead = (fileId: string) => {
    const file = simulator.files.get(fileId);
    if (!file) return;

    // Animate block access
    setAnimatingBlocks([]);
    file.blocks.forEach((b, i) => {
      setTimeout(() => {
        setAnimatingBlocks((prev) => [...prev, b]);
      }, i * 150);
    });

    setTimeout(() => {
      const log = simulator.readFile(fileId);
      if (log) setSelectedLog(log);
      refresh();
      setTimeout(() => setAnimatingBlocks([]), 500);
    }, file.blocks.length * 150 + 200);
  };

  const handleDelete = (fileId: string) => {
    simulator.deleteFile(fileId);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          File Access Mechanisms
        </h1>
        <p className="text-muted-foreground mt-1">
          Compare allocation methods and watch how blocks are accessed during
          read/write operations
        </p>
      </div>

      {/* Allocation method selector */}
      <Tabs
        value={method}
        onValueChange={(v) => setMethod(v as AllocationMethod)}
      >
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="contiguous">Contiguous</TabsTrigger>
          <TabsTrigger value="linked">Linked</TabsTrigger>
          <TabsTrigger value="indexed">Indexed</TabsTrigger>
        </TabsList>

        {/* Method info */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-4 w-4 text-blue-500" />
              {allocationInfo[method].title}
            </CardTitle>
            <CardDescription>{allocationInfo[method].desc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Advantages</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {allocationInfo[method].pros.map((p, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-emerald-500 mt-0.5">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-red-500 mb-1">Disadvantages</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {allocationInfo[method].cons.map((c, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-red-400 mt-0.5">✗</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create controls */}
        <Card className="mt-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Size:
                </span>
                <Slider
                  value={fileSize}
                  onValueChange={setFileSize}
                  max={20}
                  min={1}
                  step={1}
                  className="flex-1"
                />
                <Badge variant="secondary">{fileSize[0]} blocks</Badge>
              </div>
              <Button onClick={handleCreate} className="gap-1">
                <PenTool className="h-4 w-4" /> Create ({method})
              </Button>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Block map with animation */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Disk Block Map</CardTitle>
            <CardDescription>
              Blocks light up as they are being read sequentially
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: "repeat(32, 1fr)" }}
            >
              {simulator.blocks.map((block) => {
                const isAnimating = animatingBlocks.includes(block.id);
                const color =
                  block.status === "free"
                    ? "bg-gray-200 dark:bg-gray-800"
                    : block.status === "corrupted"
                    ? "bg-red-500"
                    : block.status === "reserved"
                    ? "bg-amber-500/60"
                    : isAnimating
                    ? "bg-cyan-400 shadow-lg shadow-cyan-400/50"
                    : "bg-slate-600";
                return (
                  <motion.div
                    key={block.id}
                    animate={
                      isAnimating
                        ? { scale: [1, 1.3, 1], opacity: [0.5, 1, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.3 }}
                    className={`aspect-square rounded-[3px] transition-colors duration-200 ${color}`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
              {[
                { color: "bg-gray-200 dark:bg-gray-800", label: "Free" },
                { color: "bg-slate-600", label: "Used" },
                { color: "bg-cyan-400", label: "Reading" },
                { color: "bg-red-500", label: "Corrupted" },
                { color: "bg-amber-500/60", label: "Reserved" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* File list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Files</CardTitle>
            <CardDescription>{files.length} files on disk</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border rounded-lg p-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate max-w-[120px]">
                        {file.name}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {file.blocks.length}b
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs flex-1 gap-1"
                        onClick={() => handleRead(file.id)}
                      >
                        <BookOpen className="h-3 w-3" /> Read
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {/* Block chain visualization */}
                    <div className="flex items-center gap-0.5 mt-2 flex-wrap">
                      {file.blocks.slice(0, 12).map((b, i) => (
                        <React.Fragment key={b}>
                          <span className="text-[9px] font-mono bg-muted px-1 py-0.5 rounded">
                            {b}
                          </span>
                          {i < Math.min(file.blocks.length, 12) - 1 && (
                            <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                          )}
                        </React.Fragment>
                      ))}
                      {file.blocks.length > 12 && (
                        <span className="text-[9px] text-muted-foreground">
                          +{file.blocks.length - 12}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Access log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Access Log
          </CardTitle>
          <CardDescription>
            Recent file operations with timing data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <div className="space-y-1">
              {logs.map((log, i) => (
                <motion.div
                  key={`${log.timestamp}-${i}`}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <Badge
                    variant={
                      log.operation === "read"
                        ? "default"
                        : log.operation === "create"
                        ? "secondary"
                        : log.operation === "delete"
                        ? "destructive"
                        : "outline"
                    }
                    className="min-w-[60px] justify-center text-[10px]"
                  >
                    {log.operation.toUpperCase()}
                  </Badge>
                  <span className="truncate flex-1 font-medium">
                    {log.fileName}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Seek: {log.seekTime.toFixed(1)}ms</span>
                    <span>Transfer: {log.transferTime.toFixed(1)}ms</span>
                    <span className="font-medium text-foreground">
                      Total: {log.totalTime.toFixed(1)}ms
                    </span>
                  </div>
                  <Badge
                    variant={log.success ? "outline" : "destructive"}
                    className="text-[10px]"
                  >
                    {log.success ? "OK" : "FAIL"}
                  </Badge>
                </motion.div>
              ))}
              {logs.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No operations yet. Create or read a file to see logs.
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
