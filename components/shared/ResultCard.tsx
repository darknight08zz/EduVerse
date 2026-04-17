"use client";

import { motion } from "framer-motion";
import { ChevronRight, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ResultCardProps {
  title: string;
  subtitle?: string;
  value: string;
  trend?: string;
  description: string;
  actionText?: string;
  icon?: any;
}

export default function ResultCard({
  title,
  subtitle,
  value,
  trend,
  description,
  actionText = "Full Report",
  icon: Icon
}: ResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group"
    >
      <Card className="bg-[#111827] border-white/10 overflow-hidden relative group-hover:border-primary/50 transition-all shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
          {Icon && <Icon className="w-24 h-24" />}
        </div>
        
        <CardHeader className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">{subtitle}</span>
            {trend && (
              <div className="flex items-center text-primary font-mono text-[10px] font-bold">
                <TrendingUp className="w-3 h-3 mr-1" /> {trend}
              </div>
            )}
          </div>
          <CardTitle className="text-xl font-bold font-outfit text-white group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 pt-0 space-y-6">
          <div className="text-3xl font-bold font-space-mono text-white">
            {value}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/20 pl-4 py-1">
            {description}
          </p>
          <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 h-10 text-xs font-mono group-hover:border-primary/30">
            {actionText} <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
