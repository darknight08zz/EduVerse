"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, TrendingUp, Sparkles } from "lucide-react";
import { calculateLevel } from "@/lib/gamification-data";
import { cn } from "@/lib/utils";

interface XPBarProps {
  currentXP: number;
  compact?: boolean;
}

export default function XPBar({ currentXP, compact }: XPBarProps) {
  const { level, title, nextLevelXP, percent } = calculateLevel(currentXP);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (currentXP > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentXP]);

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
         <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
            <span className="text-xs font-black text-primary">{level}</span>
         </div>
         <div className="flex-1">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: `${percent}%` }} 
                 className="h-full bg-primary" 
               />
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center border border-white/20 shadow-lg transition-transform",
            isAnimating && "scale-110 rotate-3"
          )}>
            <Zap className={cn("w-5 h-5 text-background", isAnimating && "animate-pulse")} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-white">Level {level}</span>
              <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[8px] font-mono uppercase tracking-widest">{title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">{nextLevelXP - currentXP} XP until Level {level + 1}</p>
          </div>
        </div>
        
        <AnimatePresence>
          {isAnimating && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center text-primary font-bold text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" /> XP GAINED
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative pt-1">
        <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-white/5 border border-white/10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 50 }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
          />
        </div>
        {isAnimating && (
          <motion.div 
            layoutId="glow"
            className="absolute top-1 left-0 h-2.5 bg-primary/40 blur-md rounded-full"
            animate={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  );
}
