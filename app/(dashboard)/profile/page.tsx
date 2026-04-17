"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  GraduationCap, 
  Target, 
  Wallet, 
  Award, 
  Zap, 
  Clock, 
  Save, 
  ShieldCheck,
  LineChart,
  Trophy,
  History as HistoryIcon,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { calculateLevel } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(data);

      const { data: historyData } = await supabase
        .from('tool_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setHistory(historyData || []);
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: profile.name,
          current_degree: profile.current_degree,
          graduation_year: profile.graduation_year,
          gpa: profile.gpa,
          gre_score: profile.gre_score,
          ielts_score: profile.ielts_score,
          budget_usd: profile.budget_usd,
          last_active: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update profile", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Decrypting Scholar Data...</p>
      </div>
    );
  }

  const levelData = calculateLevel(profile?.xp_points || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-xl">
                <User className="w-8 h-8 text-background" />
             </div>
             <div>
                <h1 className="text-4xl font-black text-white font-outfit tracking-tight">{profile?.name || "Scholar"}</h1>
                <div className="flex items-center space-x-2 text-primary font-mono text-xs uppercase tracking-widest">
                   <ShieldCheck className="w-4 h-4" />
                   <span>Verified Global Student Agent</span>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-2xl p-4 flex items-center space-x-6 shadow-xl">
           <div className="text-center space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-tighter">Current Level</p>
              <p className="text-xl font-black text-white font-space-mono">{levelData.level}</p>
           </div>
           <div className="h-10 w-px bg-white/5" />
           <div className="text-center space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-tighter">Total XP</p>
              <p className="text-xl font-black text-primary font-space-mono">{profile?.xp_points || 0}</p>
           </div>
           <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-background font-bold h-12 px-6">
              {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
           </Button>
        </div>
      </header>

      <Tabs defaultValue="academic" className="space-y-8">
        <TabsList className="bg-white/5 border border-white/10 p-1 h-14 rounded-2xl">
          <TabsTrigger value="academic" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-background">
            <GraduationCap className="w-4 h-4 mr-2" /> Academic Profile
          </TabsTrigger>
          <TabsTrigger value="financial" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-background">
            <Wallet className="w-4 h-4 mr-2" /> Financial Status
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-background">
            <HistoryIcon className="w-4 h-4 mr-2" /> Tool History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="space-y-8 mt-0">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-[#111827] border-white/10 shadow-2xl">
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-primary">Foundational Data</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <Label className="text-xs text-muted-foreground uppercase">Full Display Name</Label>
                  <Input 
                    value={profile.name ?? ""} 
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="bg-white/5 border-white/10 h-12" 
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-xs text-muted-foreground uppercase">Current highest degree</Label>
                  <Input 
                    value={profile.current_degree ?? ""} 
                    onChange={e => setProfile({...profile, current_degree: e.target.value})}
                    className="bg-white/5 border-white/10 h-12" 
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-xs text-muted-foreground uppercase">Graduation Year</Label>
                  <Select value={profile.graduation_year?.toString() || "2024"} onValueChange={v => setProfile({...profile, graduation_year: parseInt(v)})}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-white/10">
                      {[2023, 2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111827] border-white/10 shadow-2xl">
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-emerald-500">Academic Metrics</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-muted-foreground uppercase">Undergraduate GPA (10.0 scale)</Label>
                    <span className="text-white font-black font-space-mono text-xl">{profile.gpa?.toFixed(1) || "0.0"}</span>
                  </div>
                  <Slider 
                    value={[profile.gpa || 0]} min={2} max={10} step={0.1}
                    onValueChange={(v) => setProfile({...profile, gpa: v[0]})}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-muted-foreground uppercase">GRE Score</Label>
                    <span className="text-white font-black font-space-mono text-xl">{profile.gre_score || "N/A"}</span>
                  </div>
                  <Slider 
                    value={[profile.gre_score || 260]} min={260} max={340} step={1}
                    onValueChange={(v) => setProfile({...profile, gre_score: v[0]})}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-muted-foreground uppercase">IELTS / TOEFL (Converted to IELTS Bands)</Label>
                    <span className="text-white font-black font-space-mono text-xl">{profile.ielts_score || "0.0"}</span>
                  </div>
                  <Slider 
                    value={[profile.ielts_score || 0]} min={0} max={9} step={0.5}
                    onValueChange={(v) => setProfile({...profile, ielts_score: v[0]})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="mt-0">
          <Card className="bg-[#111827] border-white/10 shadow-2xl max-w-2xl mx-auto">
             <CardHeader className="bg-primary/5 border-b border-white/5">
                <CardTitle className="text-sm font-mono uppercase tracking-widest text-primary flex items-center">
                   <Wallet className="w-4 h-4 mr-2" /> Global Funding Capacity
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-10">
                <div className="text-center space-y-2">
                   <p className="text-4xl font-black text-white font-space-mono">${profile.budget_usd?.toLocaleString() || "0"}</p>
                   <p className="text-xs text-muted-foreground uppercase font-mono tracking-widest">Total Estimated Budget Available</p>
                </div>
                <Slider 
                  value={[profile.budget_usd || 10000]} min={10000} max={250000} step={5000}
                  onValueChange={(v) => setProfile({...profile, budget_usd: v[0]})}
                  className="py-10"
                />
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                   <div className="flex items-center text-xs text-muted-foreground">
                      <Target className="w-4 h-4 mr-3 text-primary" />
                      AI uses this to filter scholarship-eligible institutions in ROI calculations.
                   </div>
                   <div className="flex items-center text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 mr-3 text-emerald-500" />
                      Encrypted and only used for your private Roadmap planning.
                   </div>
                </div>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0 space-y-8">
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.length > 0 ? history.map((item, i) => (
                <Card key={i} className="bg-[#111827] border-white/10 hover:border-primary/50 transition-all group overflow-hidden relative shadow-xl">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                      {item.tool_name === 'roi_calculator' ? <LineChart className="w-16 h-16" /> : <Target className="w-16 h-16" />}
                   </div>
                   <CardContent className="p-6 space-y-4 relative z-10">
                      <div className="flex justify-between items-start">
                         <Badge variant="outline" className="text-[9px] uppercase font-mono border-white/10 text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                         </Badge>
                         <Trophy className={cn("w-4 h-4", i === 0 ? "text-primary" : "text-muted-foreground/30")} />
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-white uppercase font-outfit">{item.tool_name.replace('_', ' ')}</h4>
                         <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                            {item.tool_name === 'roi_calculator' ? `ROI: ${item.results.lifetimeGainINR || "Calculated"}` : `Top Fit: ${item.results.countryRecommendations?.[0]?.country || "N/A"}`}
                         </p>
                      </div>
                      <Button variant="ghost" className="w-full h-8 text-[10px] font-mono text-primary hover:bg-primary/5 group/btn">
                         REVISIT ANALYSIS <ArrowRight className="ml-2 w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                   </CardContent>
                </Card>
              )) : (
                 <div className="col-span-full py-20 text-center space-y-4 opacity-40">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-[10px] font-mono uppercase tracking-widest">No Analysis Cycles Found</p>
                    <Button variant="outline" className="border-white/10">Start First Simulation</Button>
                 </div>
              )}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
