"use client";

import { Award, ShieldCheck, Star, Trophy, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const BADGES = [
  { name: "Early Adopter", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "ROI Pro", icon: Trophy, color: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "Verified Profile", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { name: "Scholar", icon: Award, color: "text-primary", bg: "bg-primary/10" },
];

export default function ProgressBadges() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {BADGES.map((badge) => (
        <Card key={badge.name} className="bg-white/5 border-white/10 p-3 flex items-center space-x-3 group hover:border-primary/50 transition-colors cursor-pointer">
          <div className={`w-10 h-10 rounded-lg ${badge.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
            <badge.icon className={`w-5 h-5 ${badge.color}`} />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-white uppercase tracking-tight">{badge.name}</p>
            <p className="text-[8px] font-mono text-muted-foreground uppercase mt-0.5">Unlocked</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
