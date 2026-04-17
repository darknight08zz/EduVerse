"use client";

import React, { useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface SliderProps {
  className?: string;
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function Slider({
  className,
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  
  // Internal state if value is not provided
  const [_internalValue, setInternalValue] = React.useState<number[]>(defaultValue || [min]);
  
  // Use provided value or internal fallback
  const currentValues = value !== undefined ? value : _internalValue;
  const currentValue = currentValues[0] ?? min;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current || disabled) return;
    updateValue(e.clientX);
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateValue(moveEvent.clientX);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const updateValue = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const width = rect.width;
    const x = Math.max(0, Math.min(clientX - rect.left, width));
    
    let newValue = min + (x / width) * (max - min);
    
    // Applying step
    if (step) {
      newValue = Math.round(newValue / step) * step;
    }
    
    // Bounds check
    newValue = Math.max(min, Math.min(max, newValue));
    
    onValueChange?.([newValue]);
    if (value === undefined) {
      setInternalValue([newValue]);
    }
  };

  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div 
      className={cn(
        "relative flex w-full items-center h-6 cursor-pointer group touch-none select-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onPointerDown={handlePointerDown}
    >
      {/* Background Track */}
      <div 
        ref={trackRef}
        className="w-full h-1 bg-white/10 rounded-full overflow-hidden"
      >
        {/* Fill Indicator */}
        <motion.div 
          className="h-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Thumb */}
      <motion.div
        className="absolute w-4 h-4 bg-white rounded-full border-2 border-primary shadow-xl z-20"
        style={{ 
          left: `calc(${percentage}% - 8px)`,
        }}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    </div>
  );
}
