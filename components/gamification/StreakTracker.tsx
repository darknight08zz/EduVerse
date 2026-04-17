"use client";

import { Flame } from "lucide-react";
import { motion } from "framer-motion";

interface StreakTrackerProps {
  days: number;
}

export default function StreakTracker({ days }: StreakTrackerProps) {
  return (
    <div className="flex items-center space-x-1.5 px-3 py-1 transparent-amber border border-amber-500/20 rounded-full">
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Flame className="w-4 h-4 text-primary fill-primary/20" />
      </motion.div>
      <span className="text-xs font-mono font-bold text-primary">
        {days} DAY STREAK
      </span>
    </div>
  );
}
