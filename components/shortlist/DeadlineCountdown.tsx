"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow, isPast } from "date-fns";
import { Clock } from "lucide-react";

export function DeadlineCountdown({ deadline }: { deadline: string | Date | null }) {
  if (!deadline) {
    return (
      <span className="text-[10px] font-mono text-muted-foreground flex items-center">
        <Clock className="w-3 h-3 mr-1" /> NO DEADLINE SET
      </span>
    );
  }

  const dDate = new Date(deadline);
  const daysLeft = Math.ceil((dDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = isPast(dDate);

  if (isExpired) {
    return (
      <span className="text-[10px] font-mono text-red-500 font-bold flex items-center bg-red-500/10 px-2 py-0.5 rounded">
        ⏰ DEADLINE PASSED
      </span>
    );
  }

  const urgencyClass = cn(
    "text-[10px] font-mono px-2 py-0.5 rounded flex items-center",
    daysLeft <= 7 ? "bg-red-500 text-white animate-pulse" :
    daysLeft <= 30 ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
    "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
  );

  return (
    <span className={urgencyClass}>
      <Clock className="w-3 h-3 mr-1" />
      {daysLeft === 0 ? "DUE TODAY" : `${daysLeft} DAYS LEFT`}
      <span className="ml-1 opacity-60">({formatDistanceToNow(dDate)})</span>
    </span>
  );
}
