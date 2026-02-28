"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulator } from "@/lib/context";
import type { AllocationMethod } from "@/lib/fs-simulator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Gauge,
  ArrowRightLeft,
  Layers,
  Clock,
  TrendingDown,
  TrendingUp,
  Play,
  BarChart3,
  Zap,
} from "lucide-react";

interface BenchmarkResult {
  method: string;
  avgSeekTime: number;
  avgTransferTime: number;
  totalTime: number;
  fragmentation: number;
}

export default function OptimizationPage() {
  const { simulator, tick, refresh } = useSimulator();
  const [defragResult, setDefragResult] = useState<{
    moves: { from: number; to: number }[];
    timeSaved: number;
  } | null>(null);
  const [defragProgress, setDefragProgress] = useState(0);
  const [isDefragging, setIsDefragging] = useState(false);
  const [defragAnimation, setDefragAnimation] = useState<{ from: number; to: number }[]>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  const stats = useMemo(() => simulator.getStats(), [simulator, tick]);

  const fragmentedFiles = useMemo(() => {
    const result: { name: string; blocks: number[]; gaps: number }[] = [];
    simulator.files.forEach((file) => {
      if (!file.isDirectory && file.blocks.length > 1) {
        let gaps = 0;
        for (let i = 1; i < file.blocks.length; i++) {
          if (file.blocks[i] !== file.blocks[i - 1] + 1) gaps++;
        }
        if (gaps > 0) {
          result.push({ name: file.name, blocks: file.blocks, gaps });
        }
      }
    });
    return result.sort((a, b) => b.gaps - a.gaps);
  }, [simulator, tick]);

  const handleDefrag = useCallback(() => {
    setIsDefragging(true);
    setDefragProgress(0);
    setDefragAnimation([]);

    const result = simulator.defragment();

    // Animate moves
    if (result.moves.length === 0) {
      setDefragResult(result);
      setIsDefragging(false);
      refresh();
      return;
    }

    const totalMoves = result.moves.length;
    let moveIndex = 0;

    const interval = setInterval(() => {
      if (moveIndex < totalMoves) {
        const currentMove = result.moves[moveIndex];
        setDefragAnimation((prev) => [...prev, currentMove]);
        setDefragProgress(((moveIndex + 1) / totalMoves) * 100);
        moveIndex++;
      } else {
        clearInterval(interval);
        setDefragResult(result);
        setIsDefragging(false);
        setDefragAnimation([]);
        refresh();
      }
    }, Math.max(20, 1500 / totalMoves));
  }, [simulator, refresh]);

  const handleBenchmark = useCallback(() => {
    setIsBenchmarking(true);
    setBenchmarks([]);

    // Benchmark each allocation method
    const methods: Array<{ key: AllocationMethod; label: string }> = [
      { key: "contiguous", label: "Contiguous" },
      { key: "linked", label: "Linked" },
      { key: "indexed", label: "Indexed" },
    ];

    const results: BenchmarkResult[] = [];

    methods.forEach((m, idx) => {
      setTimeout(async () => {
        // Create a temporary simulator for benchmarking
        const { FileSystemSimulator: FSSimulator } = await import("@/lib/fs-simulator");
        const tempSim = new FSSimulator(256);

        // Create 15 files
        const files: string[] = [];
        for (let i = 0; i < 15; i++) {
          const size = Math.ceil(Math.random() * 8) + 2;
          const f = tempSim.createFile(`bench_${i}.dat`, size, "root", m.key);
          if (f) files.push(f.id);
        }

        // Delete some to create fragmentation
        for (let i = 0; i < 5; i++) {
          if (files[i * 2]) tempSim.deleteFile(files[i * 2]);
        }

        // Create more files
        for (let i = 0; i < 5; i++) {
          const size = Math.ceil(Math.random() * 6) + 1;
          const f = tempSim.createFile(`bench_new_${i}.dat`, size, "root", m.key);
          if (f) files.push(f.id);
        }

        // Read all remaining files
        const remainingFiles = Array.from(tempSim.files.values()).filter(
          (f: { isDirectory: boolean }) => !f.isDirectory
        );
        remainingFiles.forEach((f: { id: string }) => tempSim.readFile(f.id));

        const tempStats = tempSim.getStats();
        results.push({
          method: m.label,
          avgSeekTime: tempStats.avgSeekTime,
          avgTransferTime: tempStats.avgTransferTime,
          totalTime: tempStats.avgSeekTime + tempStats.avgTransferTime,
          fragmentation: tempStats.fragmentationPercent,
        });

        if (idx === methods.length - 1) {
          setBenchmarks(results);
          setIsBenchmarking(false);
        }
      }, idx * 300);
    });
  }, []);

  // Calculate which blocks are being moved for animation
  const movingFrom = new Set(defragAnimation.filter(Boolean).map((m) => m.from));
  const movingTo = new Set(defragAnimation.filter(Boolean).map((m) => m.to));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Read/Write <span className="text-gradient">Optimization</span>
        </h1>
        <p className="text-muted-foreground mt-1 leading-relaxed">
          Defragment the disk, benchmark allocation methods, and optimize
          access times
        </p>
      </div>

      {/* Current performance stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="card-hover border-orange-500/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-orange-400" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                Fragmentation
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {stats.fragmentationPercent}%
            </p>
            <Progress
              value={stats.fragmentationPercent}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>
        <Card className="card-hover border-blue-500/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-400" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                Avg Seek Time
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{stats.avgSeekTime}ms</p>
          </CardContent>
        </Card>
        <Card className="card-hover border-purple-500/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft className="h-4 w-4 text-purple-400" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                Avg Transfer
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{stats.avgTransferTime}ms</p>
          </CardContent>
        </Card>
        <Card className="card-hover border-emerald-500/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="h-4 w-4 text-emerald-400" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                Fragmented Files
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{fragmentedFiles.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Defragmentation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Disk Defragmentation
              </CardTitle>
              <CardDescription>
                Rearrange blocks so each file's data is contiguous, reducing
                seek time
              </CardDescription>
            </div>
            <Button
              onClick={handleDefrag}
              disabled={isDefragging}
              className="gap-2"
            >
              <Play className="h-4 w-4" /> Defragment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          {isDefragging && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Moving blocks...
                </span>
                <span>{Math.round(defragProgress)}%</span>
              </div>
              <Progress value={defragProgress} className="h-2" />
            </div>
          )}

          {/* Before/after disk map */}
          <div>
            <p className="text-sm font-medium mb-2">
              {isDefragging ? "Defragmenting..." : "Disk Layout"}
            </p>
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: "repeat(32, 1fr)" }}
            >
              {simulator.blocks.map((block) => {
                const isMovingFrom = movingFrom.has(block.id);
                const isMovingTo = movingTo.has(block.id);

                let color =
                  block.status === "free"
                    ? "bg-muted/40"
                    : block.status === "reserved"
                    ? "bg-amber-500/60"
                    : block.status === "corrupted"
                    ? "bg-red-500"
                    : "bg-emerald-500/70";

                if (isMovingFrom) color = "bg-orange-400";
                if (isMovingTo) color = "bg-cyan-400";

                return (
                  <motion.div
                    key={`${block.id}-${block.status}-${tick}`}
                    initial={false}
                    animate={
                      isMovingFrom || isMovingTo
                        ? { scale: [1, 1.2, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.3 }}
                    className={`aspect-square rounded-[3px] transition-colors duration-150 ${color}`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
                Used
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted/40" />
                Free
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-orange-400" />
                Moving From
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-cyan-400" />
                Moving To
              </div>
            </div>
          </div>

          {/* Defrag result */}
          <AnimatePresence>
            {defragResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-muted rounded-lg p-4"
              >
                <div className="grid sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Blocks Moved
                    </p>
                    <p className="text-2xl font-bold">
                      {defragResult.moves.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Time Saved
                    </p>
                    <p className="text-2xl font-bold text-emerald-500">
                      {defragResult.timeSaved.toFixed(1)}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      New Fragmentation
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.fragmentationPercent}%
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Fragmented files list */}
      {fragmentedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fragmented Files</CardTitle>
            <CardDescription>
              Files with non-contiguous block allocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fragmentedFiles.map((file, i) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 py-2"
                >
                  <span className="text-sm font-medium min-w-[120px] truncate">
                    {file.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {file.gaps} gap{file.gaps > 1 ? "s" : ""}
                  </Badge>
                  <div className="flex-1 flex items-center gap-0.5">
                    {file.blocks.map((b, bi) => {
                      const isGap =
                        bi > 0 && b !== file.blocks[bi - 1] + 1;
                      return (
                        <React.Fragment key={b}>
                          {isGap && (
                            <div className="w-2 h-4 border-l-2 border-dashed border-red-400 mx-0.5" />
                          )}
                          <div
                            className={`h-4 rounded-sm text-[8px] flex items-center justify-center font-mono min-w-[18px] ${
                              isGap
                                ? "bg-red-500/20 border border-red-500/40"
                                : "bg-emerald-500/20 border border-emerald-500/40"
                            }`}
                          >
                            {b}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benchmark */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Allocation Method Benchmark
              </CardTitle>
              <CardDescription>
                Compare performance of contiguous, linked, and indexed
                allocation under identical workloads
              </CardDescription>
            </div>
            <Button
              onClick={handleBenchmark}
              variant="outline"
              disabled={isBenchmarking}
              className="gap-2"
            >
              <Play className="h-4 w-4" /> Run Benchmark
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isBenchmarking && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Gauge className="h-6 w-6" />
              </motion.div>
              <span className="ml-2">Running benchmarks...</span>
            </div>
          )}

          {benchmarks.length > 0 && (
            <div className="space-y-4">
              {/* Bar chart visualization */}
              <div className="space-y-4">
                {benchmarks.map((b, i) => {
                  const maxTime = Math.max(...benchmarks.map((x) => x.totalTime));
                  const barWidth =
                    maxTime > 0 ? (b.totalTime / maxTime) * 100 : 0;

                  return (
                    <motion.div
                      key={b.method}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{b.method}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Seek: <b className="text-foreground">{b.avgSeekTime.toFixed(2)}ms</b>
                          </span>
                          <span>
                            Transfer: <b className="text-foreground">{b.avgTransferTime.toFixed(2)}ms</b>
                          </span>
                          <span>
                            Frag: <b className="text-foreground">{b.fragmentation}%</b>
                          </span>
                        </div>
                      </div>
                      <div className="h-8 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ delay: i * 0.15 + 0.2, duration: 0.6 }}
                          className={`h-full rounded-full flex items-center px-3 text-xs font-mono text-white ${
                            i === 0
                              ? "bg-blue-500"
                              : i === 1
                              ? "bg-purple-500"
                              : "bg-emerald-500"
                          }`}
                        >
                          {b.totalTime.toFixed(2)}ms
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <Separator />

              {/* Best method recommendation */}
              <div className="bg-muted rounded-lg p-4 flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Recommendation</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(() => {
                      const best = [...benchmarks].sort(
                        (a, b) => a.totalTime - b.totalTime
                      )[0];
                      return best
                        ? `${best.method} allocation performed best with an average total access time of ${best.totalTime.toFixed(2)}ms and ${best.fragmentation}% fragmentation. For workloads with frequent random access, indexed allocation is preferred. For large sequential files, contiguous allocation minimizes seek time.`
                        : "Run the benchmark to see recommendations.";
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {benchmarks.length === 0 && !isBenchmarking && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Click &quot;Run Benchmark&quot; to compare allocation methods
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
