"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulator } from "@/lib/context";
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
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Zap,
  Shield,
  CheckCircle2,
  XCircle,
  Search,
  RotateCcw,
  HardDrive,
  Activity,
} from "lucide-react";

interface CrashEvent {
  id: number;
  timestamp: number;
  severity: number;
  corruptedBlocks: number[];
  recovered: number[];
  lost: number[];
  filesAffected: string[];
}

export default function CrashRecoveryPage() {
  const { simulator, tick, refresh } = useSimulator();
  const [severity, setSeverity] = useState([0.15]);
  const [crashes, setCrashes] = useState<CrashEvent[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [fsckResult, setFsckResult] = useState<{
    orphanBlocks: number[];
    missingBlocks: number[];
    inconsistentFiles: string[];
  } | null>(null);
  const [crashAnimation, setCrashAnimation] = useState(false);

  const stats = useMemo(() => simulator.getStats(), [simulator, tick]);

  const handleCrash = useCallback(() => {
    setCrashAnimation(true);
    setTimeout(() => {
      const corruptedBlocks = simulator.simulateCrash(severity[0]);
      const crashEvent: CrashEvent = {
        id: Date.now(),
        timestamp: Date.now(),
        severity: severity[0],
        corruptedBlocks,
        recovered: [],
        lost: [],
        filesAffected: [],
      };
      setCrashes((prev) => [crashEvent, ...prev]);
      refresh();
      setTimeout(() => setCrashAnimation(false), 500);
    }, 300);
  }, [simulator, severity, refresh]);

  const handleRecover = useCallback(() => {
    setIsRecovering(true);
    setRecoveryProgress(0);

    // Animate recovery progress
    const steps = 20;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setRecoveryProgress((step / steps) * 100);
      if (step >= steps) {
        clearInterval(interval);
        const result = simulator.recoverCorruptedBlocks();

        // Update the latest crash event
        setCrashes((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[0] = {
              ...updated[0],
              recovered: result.recovered,
              lost: result.lost,
              filesAffected: result.filesAffected,
            };
          }
          return updated;
        });

        refresh();
        setTimeout(() => {
          setIsRecovering(false);
          setRecoveryProgress(0);
        }, 500);
      }
    }, 100);
  }, [simulator, refresh]);

  const handleFsck = useCallback(() => {
    const result = simulator.runFsck();
    setFsckResult(result);
  }, [simulator]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Disk Crash & Recovery
        </h1>
        <p className="text-muted-foreground mt-1">
          Simulate disk failures and use recovery techniques to repair the file
          system
        </p>
      </div>

      {/* Crash animation overlay */}
      <AnimatePresence>
        {crashAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/30 backdrop-blur-sm pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: [0.5, 1.5, 1] }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Zap className="h-24 w-24 text-red-500 mx-auto" />
              <p className="text-2xl font-bold text-red-500 mt-2">
                DISK CRASH!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Simulate Crash
            </CardTitle>
            <CardDescription>
              Randomly corrupt disk blocks to simulate a crash
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground min-w-[60px]">
                Severity:
              </span>
              <Slider
                value={severity}
                onValueChange={setSeverity}
                max={0.5}
                min={0.05}
                step={0.05}
                className="flex-1"
              />
              <Badge variant="destructive">
                {Math.round(severity[0] * 100)}%
              </Badge>
            </div>
            <Button
              onClick={handleCrash}
              variant="destructive"
              className="w-full gap-2"
              disabled={isRecovering}
            >
              <Zap className="h-4 w-4" /> Trigger Disk Crash
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-emerald-500" />
              Recovery Tools
            </CardTitle>
            <CardDescription>
              Attempt to recover corrupted blocks and check consistency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isRecovering && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recovering...</span>
                  <span>{Math.round(recoveryProgress)}%</span>
                </div>
                <Progress value={recoveryProgress} className="h-2" />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleRecover}
                className="flex-1 gap-2"
                disabled={isRecovering || stats.corruptedBlocks === 0}
              >
                <RotateCcw className="h-4 w-4" /> Recover Blocks
              </Button>
              <Button
                onClick={handleFsck}
                variant="outline"
                className="flex-1 gap-2"
              >
                <Search className="h-4 w-4" /> Run fsck
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disk visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Disk Block Status
          </CardTitle>
          <CardDescription>
            Current state of all {stats.totalBlocks} blocks — corrupted blocks
            flash red
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="grid gap-[3px]"
            style={{ gridTemplateColumns: "repeat(32, 1fr)" }}
          >
            {simulator.blocks.map((block) => {
              const isCorrupted = block.status === "corrupted";
              const color =
                block.status === "free"
                  ? "bg-gray-200 dark:bg-gray-800"
                  : block.status === "corrupted"
                  ? "bg-red-500"
                  : block.status === "reserved"
                  ? "bg-amber-500/60"
                  : "bg-emerald-600";

              return (
                <motion.div
                  key={`${block.id}-${block.status}`}
                  initial={false}
                  animate={
                    isCorrupted
                      ? {
                          opacity: [0.4, 1, 0.4],
                          scale: [1, 1.1, 1],
                        }
                      : { opacity: 1, scale: 1 }
                  }
                  transition={
                    isCorrupted
                      ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.3 }
                  }
                  className={`aspect-square rounded-[3px] ${color}`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
            {[
              { color: "bg-gray-200 dark:bg-gray-800", label: "Free" },
              { color: "bg-emerald-600", label: "Used (Healthy)" },
              { color: "bg-red-500", label: `Corrupted (${stats.corruptedBlocks})` },
              { color: "bg-amber-500/60", label: "Reserved" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* fsck result */}
      <AnimatePresence>
        {fsckResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-500" />
                  File System Consistency Check (fsck)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      {fsckResult.orphanBlocks.length === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">Orphan Blocks</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {fsckResult.orphanBlocks.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Blocks marked used but not referenced by any file
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      {fsckResult.missingBlocks.length === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">Missing Blocks</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {fsckResult.missingBlocks.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Blocks referenced by files but marked free
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      {fsckResult.inconsistentFiles.length === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        Inconsistent Files
                      </span>
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      {fsckResult.inconsistentFiles.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Files with corrupted or mismatched block references
                    </p>
                  </div>
                </div>
                {fsckResult.orphanBlocks.length === 0 &&
                  fsckResult.missingBlocks.length === 0 &&
                  fsckResult.inconsistentFiles.length === 0 && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>File System is Consistent</AlertTitle>
                      <AlertDescription>
                        No inconsistencies detected. All blocks and file
                        references are valid.
                      </AlertDescription>
                    </Alert>
                  )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crash history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Crash & Recovery History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {crashes.map((crash) => (
                <motion.div
                  key={crash.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-sm">
                        Crash at{" "}
                        {new Date(crash.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <Badge variant="destructive">
                      {Math.round(crash.severity * 100)}% severity
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Corrupted
                      </span>
                      <p className="font-mono font-bold text-red-500">
                        {crash.corruptedBlocks.length} blocks
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Recovered
                      </span>
                      <p className="font-mono font-bold text-emerald-500">
                        {crash.recovered.length} blocks
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">
                        Lost
                      </span>
                      <p className="font-mono font-bold text-orange-500">
                        {crash.lost.length} blocks
                      </p>
                    </div>
                  </div>

                  {crash.corruptedBlocks.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {crash.corruptedBlocks.slice(0, 20).map((b) => (
                        <Badge
                          key={b}
                          variant={
                            crash.recovered.includes(b)
                              ? "default"
                              : crash.lost.includes(b)
                              ? "destructive"
                              : "outline"
                          }
                          className="text-[10px] font-mono"
                        >
                          {b}
                        </Badge>
                      ))}
                      {crash.corruptedBlocks.length > 20 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{crash.corruptedBlocks.length - 20}
                        </Badge>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
              {crashes.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No crashes yet. Use the controls above to simulate one.
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
