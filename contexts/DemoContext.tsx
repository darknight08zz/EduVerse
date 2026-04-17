"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { DEMO_PROFILE, DEMO_SHORTLIST } from "@/lib/demo-data";
import { useRouter } from "next/navigation";

interface DemoContextType {
  isDemoMode: boolean;
  demoProfile: typeof DEMO_PROFILE;
  demoShortlist: typeof DEMO_SHORTLIST;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("eduverse_demo_mode");
    if (saved === "true") setIsDemoMode(true);
  }, []);

  const enterDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem("eduverse_demo_mode", "true");
    router.push("/dashboard");
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem("eduverse_demo_mode");
    router.push("/");
  };

  return (
    <DemoContext.Provider value={{
      isDemoMode,
      demoProfile: DEMO_PROFILE,
      demoShortlist: DEMO_SHORTLIST,
      enterDemoMode,
      exitDemoMode,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export const useDemoMode = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemoMode must be used within a DemoProvider");
  return context;
};
