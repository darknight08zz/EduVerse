"use client";

import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Sparkles,
  Award
} from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  xpReward: string;
  href: string;
  isComplete: boolean;
}

interface GettingStartedChecklistProps {
  profile: any;
  toolsUsed: string[];
  shortlistCount: number;
}

export default function GettingStartedChecklist({
  profile,
  toolsUsed,
  shortlistCount
}: GettingStartedChecklistProps) {
  const items: ChecklistItem[] = [
    {
      id: 'profile',
      label: 'Complete your profile',
      description: 'Tell us your degree, scores, and target countries',
      xpReward: '+100 XP',
      href: '/onboarding',
      isComplete: !!(
        profile?.onboarding_complete || 
        (profile?.current_degree || profile?.degree) ||
        (profile?.xp_points > 50)
      ),
    },
    {
      id: 'career',
      label: 'Explore university matches',
      description: 'Get AI-powered country and university recommendations',
      xpReward: '+50 XP',
      href: '/career-navigator',
      isComplete: toolsUsed.includes('career_navigator'),
    },
    {
      id: 'admission',
      label: 'Check your admission odds',
      description: 'Get a realistic probability for your target schools',
      xpReward: '+35 XP',
      href: '/admission-predictor',
      isComplete: toolsUsed.includes('admission_predictor'),
    },
    {
      id: 'roi',
      label: 'Calculate your ROI',
      description: 'See if your degree investment pays off',
      xpReward: '+40 XP',
      href: '/roi-calculator',
      isComplete: toolsUsed.includes('roi_calculator'),
    },
    {
      id: 'shortlist',
      label: 'Shortlist your first university',
      description: 'Save a university to your tracker',
      xpReward: '+25 XP',
      href: '/shortlist',
      isComplete: shortlistCount > 0,
    },
  ];

  const completedCount = items.filter(i => i.isComplete).length;
  const progress = (completedCount / items.length) * 100;
  const isAllComplete = completedCount === items.length;

  if (isAllComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_20px_#10b98150]">
          <Award className="w-8 h-8 text-background" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white font-outfit">You're all set! 🎉</h3>
          <p className="text-muted-foreground text-sm">You've mastered the essentials. Keep exploring to earn more XP.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <section className="bg-[#111827] border border-white/10 rounded-3xl p-8 space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Sparkles className="w-32 h-32" />
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white font-outfit">Get started — 5 steps to your journey</h3>
            <p className="text-muted-foreground text-sm">Level up your profile and unlock personalized AI insights.</p>
          </div>
          <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
             <span className="text-xs font-mono font-bold text-primary">{completedCount} / 5</span>
             <Progress value={progress} className="w-24 h-1.5 bg-white/5" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 relative z-10">
        {items.map((item) => (
          <Link key={item.id} href={item.href}>
            <div className={cn(
              "flex items-center justify-between p-4 rounded-2xl border transition-all group cursor-pointer",
              item.isComplete ? "bg-emerald-500/5 border-emerald-500/10 opacity-70" : "bg-white/5 border-white/5 hover:border-primary/50"
            )}>
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all",
                  item.isComplete ? "bg-emerald-500 border-emerald-500 text-background" : "border-white/10 text-muted-foreground group-hover:border-primary/50"
                )}>
                  {item.isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3" />}
                </div>
                <div className="flex flex-col">
                  <span className={cn("text-sm font-bold", item.isComplete ? "text-muted-foreground" : "text-white group-hover:text-primary transition-colors")}>{item.label}</span>
                  <p className="text-[10px] text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className={cn(
                  "text-[9px] font-bold border-none",
                  item.isComplete ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                )}>
                  {item.xpReward}
                </Badge>
                <ArrowRight className={cn(
                  "w-4 h-4 transition-all opacity-40 group-hover:opacity-100 group-hover:translate-x-1",
                  item.isComplete ? "text-emerald-500" : "text-primary"
                )} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
