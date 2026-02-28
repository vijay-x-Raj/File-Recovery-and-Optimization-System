"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { FileSystemSimulator, getSimulator } from "@/lib/fs-simulator";

interface SimulatorContextType {
  simulator: FileSystemSimulator;
  tick: number;
  refresh: () => void;
  reset: () => void;
}

const SimulatorContext = createContext<SimulatorContextType | null>(null);

export function SimulatorProvider({ children }: { children: React.ReactNode }) {
  const [simulator, setSimulator] = useState(() => getSimulator(true));
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  const reset = useCallback(() => {
    const newSim = getSimulator(true);
    setSimulator(newSim);
    setTick((t) => t + 1);
  }, []);

  return (
    <SimulatorContext.Provider value={{ simulator, tick, refresh, reset }}>
      {children}
    </SimulatorContext.Provider>
  );
}

export function useSimulator() {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error("useSimulator must be used within SimulatorProvider");
  return ctx;
}
