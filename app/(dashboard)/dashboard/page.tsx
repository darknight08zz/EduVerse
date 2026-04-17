"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Award,
  ArrowUpRight,
  Target,
  Clock,
  ChevronRight,
  GraduationCap,
  LineChart,
  MessageSquare,
  Wallet,
  CheckCircle2,
  Calendar,
  Share2,
  ExternalLink,
  LayoutDashboard,
  PlusCircle,
  Sparkles,
  Layers,
  ShieldCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { calculateLevel } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useDemoMode } from "@/contexts/DemoContext";
import GettingStartedChecklist from "@/components/dashboard/GettingStartedChecklist";

const MODULES = [
  { id: 'profile', name: 'Profile Setup', icon: Users, href: '/profile', xp: 100, desc: 'Complete your academic & career profile' },
  { id: 'career', name: 'Career Navigator', icon: GraduationCap, href: '/career-navigator', xp: 50, desc: 'Find your dream field & universities' },
  { id: 'roi', name: 'ROI Calculator', icon: LineChart, href: '/roi-calculator', xp: 40, desc: 'Calculate the true value of your degree' },
  { id: 'admission', name: 'Admission Predictor', icon: BookOpen, href: '/admission-predictor', xp: 35, desc: 'Check your odds of target admits' },
  { id: 'mentor', name: 'Mentor Chat', icon: MessageSquare, href: '/mentor-chat', xp: 10, desc: 'Instant 24/7 expert advice' },
  { id: 'loan', name: 'Loan Estimator', icon: Wallet, href: '/loan-estimator', xp: 60, desc: 'Match with lenders & calculate EMI' },
];

const JOURNEY_STEPS = [
  { id: 'profile', label: 'Profile Complete', href: '/profile' },
  { id: 'career', label: 'Career Explored', href: '/career-navigator' },
  { id: 'universities', label: 'Universities Shortlisted', href: '/shortlist' },
  { id: 'loan', label: 'Loan Ready', href: '/loan-estimator' },
  { id: 'applied', label: 'Applied', href: '/shortlist' },
];

export default function Dashboard() {
  const { isDemoMode, demoProfile, demoShortlist } = useDemoMode();
  const [profile, setProfile] = useState<any>(null);
  const [dailyTip, setDailyTip] = useState<string>("");
  const [activity, setActivity] = useState<any[]>([]);
  const [usage, setUsage] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [priorityData, setPriorityData] = useState<any>(null);
  const [isLoadingPriority, setIsLoadingPriority] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (isDemoMode) {
        setProfile(demoProfile);
        setItems(demoShortlist);
        setActivity([
          { tool_name: 'career_navigator', used_at: new Date(Date.now() - 3600000 * 2).toISOString(), xp_earned: 50 },
          { tool_name: 'roi_calculator', used_at: new Date(Date.now() - 3600000 * 5).toISOString(), xp_earned: 40 },
          { tool_name: 'mentor_chat', used_at: new Date(Date.now() - 3600000 * 24).toISOString(), xp_earned: 10 },
        ]);
        setUsage(['career_navigator', 'roi_calculator', 'mentor_chat']);
        setDailyTip("💡 Arjun, with your 8.4 GPA, focusing on MS CS at UCSD is a strong move. Aim for a 325+ GRE to lock it in.");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      setProfile(profile);

      // Load Shortlist for Deadlines
      const { data: shortlist } = await supabase
        .from('university_shortlist')
        .select('*')
        .eq('user_id', user.id)
        .not('application_deadline', 'is', null)
        .order('application_deadline', { ascending: true })
        .limit(3);
      setItems(shortlist || []);

      // Load recent activity from tool_usage AND tool_history
      const { data: usageHistory } = await supabase
        .from('tool_usage')
        .select('*')
        .eq('user_id', user.id);
      
      const { data: historyItems } = await supabase
        .from('tool_history')
        .select('*')
        .eq('user_id', user.id);

      const combinedActivity = [
        ...(usageHistory || []),
        ...(historyItems || []).map(h => ({
          tool_name: h.tool_name,
          used_at: h.created_at,
          xp_earned: 0 // History doesn't track XP increments directly
        }))
      ].sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime());

      setActivity(combinedActivity.slice(0, 5));
      setUsage(combinedActivity.map(r => r.tool_name));

      // Handle Daily Tip (Cached 24h)
      const cachedTipData = localStorage.getItem('eduverse_daily_tip');
      if (cachedTipData) {
        const { tip, date } = JSON.parse(cachedTipData);
        const isToday = new Date(date).toDateString() === new Date().toDateString();
        if (isToday) {
           setDailyTip(tip);
           return;
        }
      }

      setIsLoadingTip(true);
      try {
        const resp = await fetch('/api/gemini/daily-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userProfile: profile })
        });
        const data = await resp.json();
        setDailyTip(data.tip);
        localStorage.setItem('eduverse_daily_tip', JSON.stringify({ tip: data.tip, date: new Date().toISOString() }));
      } finally {
        setIsLoadingTip(false);
      }
    };

    loadData();

    const handleXPUpdate = () => {
      loadData();
    };
    window.addEventListener('xp_earned', handleXPUpdate);
    return () => window.removeEventListener('xp_earned', handleXPUpdate);
  }, [isDemoMode, demoProfile, demoShortlist]);

  // AI Personalization Agent
  useEffect(() => {
    async function loadPriority() {
      if (isDemoMode) {
        setPriorityData({
          greeting: "Good morning Arjun! Ready to finalize your UCSD application?",
          urgencyLevel: "high",
          nextActions: [
            { action: "Finalize UCSD SOP Draft", module: "sop_copilot", urgency: "high", reason: "Deadline in 45 days" },
            { action: "Check ROI for MS AI at CMU", module: "roi_calculator", urgency: "medium", reason: "Higher potential salary" },
            { action: "Start Loan Eligibility Check", module: "loan_estimator", urgency: "medium", reason: "Financial proof needed for I-20" }
          ]
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setIsLoadingPriority(true);
      try {
        const resp = await fetch('/api/agents/personalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        const data = await resp.json();
        setPriorityData(data);
      } finally {
        setIsLoadingPriority(false);
      }
    }
    loadPriority();
  }, [isDemoMode]);

  // AI Nudge Polling
  useEffect(() => {
    async function fetchNotifications() {
      if (isDemoMode) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false });
      
      setNotifications(data || []);
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [isDemoMode]);

  const markNotificationRead = async (id: string) => {
    await supabase.from('user_notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const stats = useMemo(() => [
    { label: "Streak", value: `${profile?.streak_days || 1} Days`, icon: Zap, color: "text-amber-500" },
    { label: "XP Points", value: profile?.xp_points || 0, icon: Sparkles, color: "text-primary" },
    { label: "Admit Prob.", value: profile?.gpa ? "74%" : "--", icon: Award, color: "text-emerald-500" },
    { label: "Loan Match", value: "92%", icon: TrendingUp, color: "text-blue-500" },
  ], [profile]);

  const totalXP = profile?.xp_points || 0;
  const showChecklist = totalXP < 1000; // Increased to 1000 for visibility as requested, normally < 100

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-10">
      {/* Journey Progress Bar */}
      <section className="bg-[#111827] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
         <div className="absolute inset-0 bg-primary/5 pointer-events-none bloomberg-grid" />
         <div className="flex items-center justify-between space-x-4 relative z-10">
            {JOURNEY_STEPS.map((step, i) => (
               <div key={step.id} className="flex-1 flex items-center group cursor-pointer">
                  <Link href={step.href} className="flex flex-col items-center flex-1 space-y-3">
                     <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                        i === 0 ? "bg-primary border-primary text-background shadow-[0_0_15px_#f59e0b50]" : "bg-white/5 border-white/10 text-muted-foreground group-hover:border-primary/50"
                     )}>
                        {i === 0 ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold">{i + 1}</span>}
                     </div>
                     <span className={cn(
                        "text-[10px] font-mono uppercase tracking-widest text-center transition-colors",
                        i === 0 ? "text-primary font-bold" : "text-muted-foreground group-hover:text-white"
                     )}>
                        {step.label}
                     </span>
                  </Link>
                  {i < JOURNEY_STEPS.length - 1 && (
                     <div className="h-0.5 flex-1 bg-white/5 mx-2" />
                  )}
               </div>
            ))}
         </div>
      </section>

      {/* Getting Started Checklist */}
      {showChecklist && (
        <GettingStartedChecklist 
          profile={profile}
          toolsUsed={usage}
          shortlistCount={items.length}
        />
      )}

      {/* Welcome & Insight Row */}
      <div className="grid lg:grid-cols-12 gap-10 items-start">
         <div className="lg:col-span-8 space-y-8">
            <header className="flex flex-col space-y-2">
               <div className="flex justify-between items-start">
                  <h1 className="text-4xl font-bold font-outfit text-white leading-tight">
                    Good morning, <span className="text-primary">{profile?.name || "Scholar"}</span>. 
                  </h1>
                  <div className="relative">
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="relative bg-white/5 border border-white/10 rounded-xl"
                        onClick={() => setShowNotifications(!showNotifications)}
                     >
                        <Zap className={cn("w-5 h-5", notifications.length > 0 ? "text-primary animate-pulse" : "text-muted-foreground")} />
                        {notifications.length > 0 && (
                           <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-background text-[10px] font-black rounded-full flex items-center justify-center">
                              {notifications.length}
                           </span>
                        )}
                     </Button>

                     <AnimatePresence>
                        {showNotifications && (
                           <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute right-0 mt-4 w-80 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                           >
                              <div className="p-4 border-b border-white/5 bg-primary/5 flex justify-between items-center">
                                 <span className="text-[10px] font-mono font-black text-primary uppercase tracking-widest">AI Lifecycle Nudges</span>
                                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setShowNotifications(false)}>×</Button>
                              </div>
                              <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                                 {notifications.length > 0 ? notifications.map((n) => (
                                    <div key={n.id} className="p-4 space-y-3 hover:bg-white/[0.02] transition-colors">
                                       <p className="text-xs text-white leading-relaxed">{n.message}</p>
                                       <div className="flex justify-between items-center">
                                          <Link href={n.module ? `/${n.module.replace('_', '-')}` : '#'}>
                                             <Button 
                                                size="sm" 
                                                className="h-7 text-[10px] bg-primary text-background font-bold"
                                                onClick={() => markNotificationRead(n.id)}
                                             >
                                                Start Mission
                                             </Button>
                                          </Link>
                                          <button 
                                             className="text-[10px] font-mono text-muted-foreground hover:text-white"
                                             onClick={() => markNotificationRead(n.id)}
                                          >
                                             Dismiss
                                          </button>
                                       </div>
                                    </div>
                                 )) : (
                                    <div className="p-10 text-center opacity-40">
                                       <Zap className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                       <p className="text-[10px] font-mono uppercase tracking-widest">No active nudges</p>
                                    </div>
                                 )}
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </div>
               <div className="flex items-center space-x-3 text-muted-foreground font-mono text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{priorityData?.greeting || "Analyzing your study abroad journey..."}</span>
               </div>
            </header>

            {/* AI Personalization: Priority Actions */}
            <AnimatePresence>
               {priorityData && (
                  <motion.section 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     className="bg-white/5 border border-primary/20 rounded-3xl p-6 space-y-6"
                  >
                     <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold font-mono tracking-widest text-primary uppercase flex items-center">
                           <Layers className="w-4 h-4 mr-2" /> Daily Priority Quests
                        </h3>
                        <span className={cn(
                           "text-[8px] font-black px-2 py-0.5 rounded border",
                           priorityData.urgencyLevel === 'high' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        )}>
                           {priorityData.urgencyLevel.toUpperCase()} PRIORITY
                        </span>
                     </div>
                     <div className="grid md:grid-cols-3 gap-4">
                        {priorityData.nextActions.map((item: any, i: number) => (
                           <Link key={i} href={`/${item.module.replace('_', '-')}`}>
                              <div className="p-4 rounded-2xl bg-[#0a0f1e] border border-white/5 hover:border-primary/50 transition-all group cursor-pointer h-full flex flex-col justify-between">
                                 <div>
                                    <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors">{item.action}</h4>
                                    <p className="text-[9px] text-muted-foreground mt-2 font-mono leading-tight">{item.reason}</p>
                                 </div>
                                 <div className="mt-4 flex items-center text-primary text-[9px] font-bold font-mono uppercase">
                                    Launch Module <ArrowUpRight className="ml-1 w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                 </div>
                              </div>
                           </Link>
                        ))}
                     </div>
                  </motion.section>
               )}
            </AnimatePresence>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {stats.map((stat, i) => (
                  <Card key={i} className="bg-[#111827] border-white/10 hover:border-primary/50 transition-all shadow-xl group">
                     <CardContent className="p-5">
                        <div className="flex items-center space-x-3 mb-2">
                           <div className={cn("p-1.5 rounded-lg bg-white/5 transition-transform group-hover:scale-110", stat.color)}>
                              <stat.icon className="w-4 h-4" />
                           </div>
                           <span className="text-[10px] uppercase font-mono tracking-tighter text-muted-foreground">{stat.label}</span>
                        </div>
                        <h4 className="text-2xl font-black text-white font-space-mono">{stat.value}</h4>
                     </CardContent>
                  </Card>
               ))}
            </div>

            {/* Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {MODULES.map((mod, i) => {
                  const isDone = usage.some(u => u.includes(mod.id));
                  return (
                    <Link key={i} href={mod.href}>
                      <Card className="bg-[#111827] border-white/10 h-full hover:border-primary/50 hover:bg-white/[0.02] transition-all group overflow-hidden relative shadow-lg">
                         <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary group-hover:bg-primary group-hover:text-background transition-all duration-300">
                                  <mod.icon className="w-6 h-6" />
                               </div>
                               <div className="flex flex-col items-end">
                                  {isDone ? (
                                     <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">COMPLETED</span>
                                  ) : (
                                     <span className="text-primary text-[10px] font-bold font-mono">+{mod.xp} XP</span>
                                  )}
                               </div>
                            </div>
                            <div>
                               <h3 className="font-bold font-outfit text-white group-hover:text-primary transition-colors">{mod.name}</h3>
                               <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{mod.desc}</p>
                            </div>
                         </CardContent>
                         <div className="absolute inset-x-0 bottom-0 h-[3px] bg-transparent group-hover:bg-primary/40 transition-all blur-sm" />
                      </Card>
                    </Link>
                  );
               })}
            </div>
         </div>

         {/* Right Sidebar: Insight & Activity */}
         <div className="lg:col-span-4 space-y-10">
            {/* Daily Insight Card */}
            <Card className="bg-primary border border-primary/20 shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl pointer-events-none">
                  <Sparkles className="w-32 h-32 text-background" />
               </div>
               <CardHeader className="relative z-10">
                  <CardTitle className="text-background font-black font-space-mono text-sm uppercase tracking-widest flex items-center">
                     <Zap className="w-4 h-4 mr-2" /> AI Daily Insight
                  </CardTitle>
               </CardHeader>
               <CardContent className="relative z-10 min-h-[140px] flex flex-col justify-center">
                  {isLoadingTip ? (
                     <div className="space-y-4">
                        <div className="h-4 w-full bg-background/10 animate-pulse rounded" />
                        <div className="h-4 w-3/4 bg-background/10 animate-pulse rounded" />
                     </div>
                  ) : (
                     <p className="text-background font-bold text-lg leading-snug">
                        {dailyTip || "💡 Today's Insight: Start your SOP draft early to highlight your unique career trajectory."}
                     </p>
                  )}
                  <div className="pt-6 mt-4 border-t border-background/20 flex justify-between items-center">
                     <span className="text-[10px] text-background/60 font-mono">NEXT UPDATE AT 00:00</span>
                     <button className="p-2 rounded-full border border-background/20 hover:bg-background/10 transition-colors">
                        <Share2 className="w-3.5 h-3.5 text-background" />
                     </button>
                  </div>
               </CardContent>
            </Card>

            {/* Upcoming Deadlines Widget */}
            <Card className="bg-[#111827] border-white/10 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
               <CardHeader className="border-b border-white/5">
                  <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                     <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-2" /> Upcoming Deadlines</span>
                     <Link href="/shortlist" className="text-primary hover:underline text-[9px]">VIEW ALL</Link>
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="divide-y divide-white/5">
                     {items.length > 0 ? items.map((item, i) => {
                        const days = Math.ceil((new Date(item.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        return (
                          <div key={i} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                             <div className="flex flex-col">
                                <span className="text-xs font-bold text-white mb-0.5">{item.university_name}</span>
                                <span className="text-[10px] text-muted-foreground uppercase font-mono">{item.program}</span>
                             </div>
                             <div className={cn(
                                "text-[10px] font-mono px-2 py-1 rounded border",
                                days <= 7 ? "bg-red-500/10 text-red-500 border-red-500/20 pulse-amber" :
                                days <= 30 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                             )}>
                                {days}d LEFT
                             </div>
                          </div>
                        );
                     }) : (
                        <div className="p-10 text-center opacity-40">
                           <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                           <p className="text-[10px] font-mono uppercase">No upcoming deadlines</p>
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card className="bg-[#111827] border-white/10 shadow-2xl">
               <CardHeader className="border-b border-white/5">
                  <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center">
                     <Clock className="w-3.5 h-3.5 mr-2" /> Recent Activity
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="divide-y divide-white/5">
                     {activity.length > 0 ? activity.map((item, i) => (
                        <div key={i} className="p-4 flex items-start space-x-3 group hover:bg-white/[0.02] transition-colors">
                           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:border-primary/30 border border-transparent transition-all">
                              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                           </div>
                           <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-bold text-white leading-none">Used {item.tool_name.split('_').join(' ')}</p>
                              <div className="flex items-center justify-between mt-2">
                                 <span className="text-[10px] font-mono text-muted-foreground uppercase">{new Date(item.used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                 <span className="text-[10px] font-bold text-primary">+{item.xp_earned} XP</span>
                              </div>
                           </div>
                        </div>
                     )) : (
                        <div className="p-12 text-center space-y-4 opacity-50">
                           <LayoutDashboard className="w-10 h-10 mx-auto text-muted-foreground" />
                           <p className="text-[10px] font-mono uppercase">Start your first mission</p>
                        </div>
                     )}
                  </div>
                  <div className="p-4 border-t border-white/5">
                     <Button variant="ghost" className="w-full h-10 text-[10px] font-mono text-muted-foreground hover:text-white group">
                        VIEW FULL HISTORY <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                     </Button>
                  </div>
               </CardContent>
            </Card>

            {/* Growth Referral Card */}
            <Card className="bg-gradient-to-br from-[#1E293B] to-[#0a0f1e] border-white/10 p-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Users className="w-32 h-32" />
               </div>
               <div className="relative z-10 space-y-4">
                  <h4 className="font-bold text-white flex items-center">
                     <PlusCircle className="w-4 h-4 mr-2 text-primary" /> Invite a Friend
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                     Get <span className="text-primary font-bold">+200 XP</span> for every friend who joins. They get a +50 XP welcome gift too!
                  </p>
                  <Button className="w-full bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40 h-10 text-xs font-mono group">
                     eduverse.app/join?ref={profile?.id?.slice(0, 8) || "GUEST"}
                     <ExternalLink className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
