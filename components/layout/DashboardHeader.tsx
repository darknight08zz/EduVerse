"use client";

import { useState, useEffect } from "react";
import { Bell, Search, User, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import XPBar from "../gamification/XPBar";
import { supabase } from "@/lib/supabase";

export default function DashboardHeader() {
  const [currentXP, setCurrentXP] = useState(0);
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('user_profiles').select('xp_points, streak_days').eq('id', user.id).single();
        if (data) {
          setCurrentXP(data.xp_points || 0);
          setStreak(data.streak_days || 1);
        }
      } else {
        const localXp = parseInt(localStorage.getItem('eduverse_xp') || '0');
        setCurrentXP(localXp);
      }
    };
    loadData();

    const handleXPUpdate = (e: any) => {
      setCurrentXP(prev => prev + e.detail.points);
    };
    window.addEventListener('xp_earned', handleXPUpdate);
    return () => window.removeEventListener('xp_earned', handleXPUpdate);
  }, []);

  return (
    <header className="h-20 border-b border-white/10 bg-[#0a0f1e]/80 backdrop-blur-xl sticky top-0 z-40 px-8 flex items-center justify-between shadow-lg">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search mentors, universities, or loans..." 
            className="pl-10 bg-white/5 border-white/10 focus-visible:ring-primary h-11 font-sans rounded-xl border-white/5 group-hover:border-white/20 transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden md:block w-48">
           <XPBar currentXP={currentXP} compact />
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
           <Zap className="h-4 w-4 text-amber-500 fill-amber-500/20" />
           <span className="text-xs font-black text-amber-500 font-mono">{streak}d</span>
        </div>
        
        <div className="h-6 w-[1px] bg-white/10 mx-2" />

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-[#0a0f1e] shadow-[0_0_8px_#f59e0b]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-10 w-10 rounded-full bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-0 overflow-hidden hover:bg-white/10 flex items-center justify-center cursor-pointer outline-none shadow-xl transition-transform hover:scale-105 active:scale-95">
            <User className="h-5 w-5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#111827] border-white/10 text-white shadow-2xl rounded-2xl p-2 animate-in fade-in zoom-in duration-200">
            <DropdownMenuLabel className="font-outfit px-3 py-2">Account Hub</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10 mx-1" />
            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer rounded-xl px-3 py-2.5 flex items-center">
               <User className="w-4 h-4 mr-3 opacity-50" /> Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer rounded-xl px-3 py-2.5 flex items-center">
               <Zap className="w-4 h-4 mr-3 opacity-50" /> Achievement Log
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10 mx-1" />
            <DropdownMenuItem className="hover:bg-red-500/10 cursor-pointer text-destructive rounded-xl px-3 py-2.5">Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
