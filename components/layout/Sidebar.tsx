"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  Wallet, 
  BookOpen, 
  LineChart, 
  MessageSquare, 
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronRight,
  UserCircle,
  LayoutGrid,
  AlertCircle,
  PenTool,
  X,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import XPBar from "@/components/gamification/XPBar";
import { supabase } from "@/lib/supabase";
import { useDemoMode } from "@/contexts/DemoContext";

const MENU_ITEMS = [
  { name: "Dash", href: "/dashboard", icon: LayoutDashboard },
  { name: "SOP", href: "/sop-copilot", icon: PenTool },
  { name: "Shortlist", href: "/shortlist", icon: LayoutGrid },
  { name: "Navigator", href: "/career-navigator", icon: GraduationCap },
  { name: "ROI", href: "/roi-calculator", icon: LineChart },
  { name: "Predict", href: "/admission-predictor", icon: BookOpen },
  { name: "Mentor", href: "/mentor-chat", icon: MessageSquare },
  { name: "Loan", href: "/loan-estimator", icon: Wallet },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isDemoMode, demoProfile, exitDemoMode } = useDemoMode();
  const [currentXP, setCurrentXP] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [shortlistCount, setShortlistCount] = useState(0);
  const [hasUrgentDeadline, setHasUrgentDeadline] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (isDemoMode) {
        setProfile(demoProfile);
        setCurrentXP(demoProfile.xp_points);
        setShortlistCount(3);
        setHasUrgentDeadline(true);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
        if (data) {
           setProfile(data);
           setCurrentXP(data.xp_points || 0);
        }

        const { data: shortlist } = await supabase
          .from('university_shortlist')
          .select('application_deadline')
          .eq('user_id', user.id);
        
        if (shortlist) {
          setShortlistCount(shortlist.length);
          const urgent = shortlist.some(item => {
            if (!item.application_deadline) return false;
            const days = Math.ceil((new Date(item.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return days > 0 && days <= 30;
          });
          setHasUrgentDeadline(urgent);
        }
      }
    };

    loadData();

    const handleXPUpdate = (e: any) => {
      setCurrentXP(prev => prev + e.detail.points);
    };
    window.addEventListener('xp_earned', handleXPUpdate);
    return () => window.removeEventListener('xp_earned', handleXPUpdate);
  }, [isDemoMode]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-white/10 bg-[#0a0f1e] flex-col h-screen sticky top-0 overflow-y-auto">
        <div className="p-8">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <GraduationCap className="text-background w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white">
              Edu<span className="text-primary italic">Verse</span>
            </span>
          </Link>
        </div>

        <div className="px-6 mb-8">
           <XPBar currentXP={currentXP} />
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-4 mb-4 opacity-50">
            Core Modules
          </div>
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/dashboard');
            return (
              <Link key={item.href} href={item.href}>
                <span className={cn(
                  "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full shadow-[0_0_10px_#f59e0b]"
                    />
                  )}
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"
                  )} />
                  <span className="truncate">{item.name}</span>
                  {item.href === "/sop-copilot" && (
                     <Badge className="ml-2 bg-primary text-background text-[8px] h-4 px-1.5 font-black animate-pulse">NEW</Badge>
                  )}
                  {(item.href === "/shortlist" || item.icon === LayoutGrid) && shortlistCount > 0 && (
                    <span className={cn(
                      "ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center",
                      hasUrgentDeadline ? "bg-red-500 text-white animate-pulse" : "bg-primary/20 text-primary"
                    )}>
                      {shortlistCount}
                      {hasUrgentDeadline && <AlertCircle className="w-3 h-3 ml-1 fill-white text-red-500" />}
                    </span>
                  )}
                  {isActive && (item.href !== "/shortlist" && item.icon !== LayoutGrid) && <ChevronRight className="ml-auto w-4 h-4" />}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/10 mt-auto">
           <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/5 border border-white/5 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                 <UserCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-xs font-bold text-white truncate">{profile?.name || "Aspiring Scholar"}</p>
                 <p className="text-[10px] text-muted-foreground font-mono truncate">{profile?.current_degree || "Explorer Phase"}</p>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" size="sm" className="h-9 text-[10px] font-mono justify-start text-muted-foreground hover:text-white">
                 <Settings className="mr-2 h-3.5 w-3.5" /> SETTINGS
              </Button>
              <Button variant="ghost" size="sm" className="h-9 text-[10px] font-mono justify-start text-destructive hover:text-destructive">
                 <LogOut className="mr-2 h-3.5 w-3.5" /> LOGOUT
              </Button>
           </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-xl border-t border-white/10 px-2 py-4 flex items-center justify-between shadow-2xl safe-bottom">
        {MENU_ITEMS.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-1 group">
               <div className={cn(
                 "p-2 rounded-xl transition-all",
                 isActive ? "bg-primary/10 text-primary scale-110" : "text-muted-foreground"
               )}>
                 <item.icon className="w-5 h-5" />
               </div>
               <span className={cn(
                 "text-[8px] font-mono uppercase tracking-tighter transition-colors",
                 isActive ? "text-primary font-bold" : "text-muted-foreground"
               )}>
                 {item.name === "Dash" ? "HOME" : item.name}
               </span>
            </Link>
          );
        })}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex-1 flex flex-col items-center justify-center gap-1"
        >
           <div className="p-2 text-muted-foreground rounded-xl">
             <Menu className="w-5 h-5" />
           </div>
           <span className="text-[8px] font-mono uppercase tracking-tighter text-muted-foreground">MORE</span>
        </button>
      </nav>

      {/* Mobile Overlay Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="lg:hidden fixed inset-0 z-[60] bg-[#0a0f1e] p-8"
          >
            <div className="flex justify-between items-center mb-10">
               <span className="text-xl font-bold font-outfit text-white tracking-widest uppercase opacity-40">Navigator</span>
               <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full bg-white/5">
                 <X className="w-6 h-6 text-white" />
               </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {MENU_ITEMS.map((item) => (
                 <Link 
                   key={item.href} 
                   href={item.href}
                   onClick={() => setIsMobileMenuOpen(false)}
                   className={cn(
                     "p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-4 transition-all",
                     pathname === item.href ? "bg-primary/10 border-primary/20" : "bg-white/5 hover:bg-white/10"
                   )}
                 >
                    <item.icon className={cn("w-8 h-8", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">{item.name}</span>
                 </Link>
               ))}
            </div>

            <div className="absolute bottom-10 left-8 right-8 space-y-4">
               <div className="flex items-center space-x-4 p-4 rounded-3xl bg-white/5 border border-white/5">
                  <UserCircle className="w-10 h-10 text-primary" />
                  <div>
                    <p className="text-sm font-bold text-white leading-none mb-1">{profile?.name || "Guest"}</p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">{profile?.current_degree || "Explorer"}</p>
                  </div>
               </div>
               <Button variant="ghost" onClick={exitDemoMode} className="w-full h-14 rounded-3xl text-destructive font-bold text-lg">
                 EXIT DEMO MODE
               </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
