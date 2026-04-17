"use client";

import { motion } from "framer-motion";
import { Sparkles, BrainCircuit, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface AILoaderProps {
  message?: string;
  className?: string;
  variant?: 'full' | 'inline' | 'compact';
}

export default function AILoader({ 
  message = "AI is thinking...", 
  className,
  variant = 'full'
}: AILoaderProps) {
  if (variant === 'compact') {
     return (
        <div className={cn("flex items-center space-x-2 text-primary font-mono text-[10px]", className)}>
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>{message}</span>
        </div>
     );
  }

  return (
    <div className={cn(
        "flex flex-col items-center justify-center space-y-6 py-12 px-8 text-center",
        variant === 'full' && "min-h-[400px] bg-[#111827]/50 rounded-3xl border border-white/5 backdrop-blur-sm",
        className
    )}>
      <div className="relative">
         {/* Animated Outer Rings */}
         <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8 border border-primary/20 rounded-full border-dashed"
         />
         <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border border-white/10 rounded-full border-dotted"
         />
         
         <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-2xl shadow-primary/20 overflow-hidden">
            <motion.div
               animate={{ 
                  y: [0, -4, 0],
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
               }}
               transition={{ duration: 3, repeat: Infinity }}
            >
               <BrainCircuit className="w-10 h-10 text-background" />
            </motion.div>
            
            {/* Dynamic scanning line */}
            <motion.div 
                animate={{ y: [-40, 40] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-1 bg-white/40 blur-sm"
            />
         </div>
      </div>

      <div className="space-y-3">
         <div className="flex items-center justify-center space-x-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <h3 className="text-xl font-bold text-white font-outfit">{message}</h3>
         </div>
         <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest animate-pulse">
            usually takes 3-5 seconds
         </p>
      </div>

      <div className="flex space-x-1.5">
         {[0, 1, 2].map(i => (
            <motion.div 
                key={i}
                animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
            />
         ))}
      </div>
    </div>
  );
}
