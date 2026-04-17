"use client";

import { motion } from "framer-motion";
import { Terminal, Cpu, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface AILoadingStateProps {
  message?: string;
}

const TERMINAL_LINES = [
  "Initializing Gemini 1.5 Flash Engine...",
  "Fetching global university admission datasets...",
  "Analyzing profile heuristics...",
  "Cross-referencing ROI metrics...",
  "Generating multi-agent career roadmap...",
  "Finalizing recommendations..."
];

export default function AILoadingState({ message = "AI is thinking..." }: AILoadingStateProps) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex((prev) => (prev + 1) % TERMINAL_LINES.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 glass rounded-3xl border-primary/20 min-h-[400px]">
      <div className="relative mb-12">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-20 h-20 rounded-2xl border-2 border-primary/30 flex items-center justify-center"
        >
          <Cpu className="w-10 h-10 text-primary" />
        </motion.div>
        
        <motion.div
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -top-2 -right-2"
        >
          <Zap className="w-6 h-6 text-primary fill-primary" />
        </motion.div>
      </div>

      <div className="text-center space-y-4 max-w-md">
        <h3 className="text-xl font-bold font-outfit text-white">{message}</h3>
        
        <div className="bg-black/40 rounded-lg p-4 font-mono text-xs text-primary/80 border border-white/5 w-full h-24 flex flex-col justify-end overflow-hidden">
          <div className="flex items-center mb-2 text-muted-foreground border-b border-white/5 pb-1">
            <Terminal className="w-3 h-3 mr-2" />
            <span>GEMINI_SYSTEM_LOG</span>
          </div>
          <motion.div
            key={lineIndex}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <span className="mr-2 text-primary font-bold">{`>`}</span>
            {TERMINAL_LINES[lineIndex]}
          </motion.div>
          <div className="flex items-center opacity-50">
            <span className="mr-2 text-primary font-bold">{`>`}</span>
            {TERMINAL_LINES[(lineIndex + TERMINAL_LINES.length - 1) % TERMINAL_LINES.length]}
          </div>
        </div>
      </div>

      <div className="mt-8 flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
            className="w-2 h-2 rounded-full bg-primary"
          />
        ))}
      </div>
    </div>
  );
}
