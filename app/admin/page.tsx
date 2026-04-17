"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  TrendingUp, 
  Target, 
  Banknote, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Layers,
  Sparkles,
  Zap,
  LayoutDashboard,
  ShieldCheck
} from "lucide-react";
import { 
  FunnelChart, 
  Funnel, 
  LabelList, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Cell 
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchStats() {
      try {
        const [users, usage, shortlist, blogs] = await Promise.all([
          supabase.from('user_profiles').select('*'),
          supabase.from('tool_usage').select('*'),
          supabase.from('university_shortlist').select('*'),
          supabase.from('blog_posts').select('*')
        ]);

        const totalUsers = users.data?.length || 0;
        const activeToday = users.data?.filter(u => 
          new Date(u.updated_at).toDateString() === new Date().toDateString()
        ).length || 0;

        // Funnel Data
        const funnelData = [
          { value: totalUsers, name: 'Signed Up', fill: '#8884d8' },
          { value: users.data?.filter(u => u.gpa).length || 0, name: 'Profile Done', fill: '#83a6ed' },
          { value: new Set(usage.data?.filter(u => u.tool_name === 'career_navigator').map(u => u.user_id)).size, name: 'Tool Engagement', fill: '#8dd1e1' },
          { value: new Set(shortlist.data?.map(s => s.user_id)).size, name: 'Shortlisted', fill: '#82ca9d' },
          { value: new Set(usage.data?.filter(u => u.tool_name === 'loan_estimator').map(u => u.user_id)).size, name: 'Loan Conversion', fill: '#a4de6c' },
        ];

        // Country Trends
        const countryCounts: Record<string, number> = {};
        users.data?.forEach(u => {
          u.target_countries?.forEach((c: string) => {
            countryCounts[c] = (countryCounts[c] || 0) + 1;
          });
        });
        const countryData = Object.entries(countryCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        setStats({
          kpis: [
            { label: "Total Scholars", value: totalUsers, icon: Users, color: "text-blue-500", trend: "+12%" },
            { label: "Active Today", value: activeToday, icon: Activity, color: "text-emerald-500", trend: "Stable" },
            { label: "AI Posts Live", value: blogs.data?.length || 0, icon: FileText, color: "text-primary", trend: "Daily" },
            { label: "Conv. Rate", value: `${Math.round((funnelData[4].value / totalUsers) * 100) || 0}%`, icon: TrendingUp, color: "text-amber-500", trend: "+2%" },
          ],
          funnelData,
          countryData,
          blogs: blogs.data?.slice(0, 5).map(b => ({
            id: b.id,
            title: b.title,
            views: b.view_count || 0,
            date: new Date(b.published_at).toLocaleDateString()
          })) || []
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
       <div className="flex flex-col items-center space-y-4">
          <Zap className="w-12 h-12 text-primary animate-pulse" />
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Accessing Command Center...</p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
             <div className="flex items-center space-x-2 text-primary text-xs font-mono font-bold uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" /> <span>EduVerse Admin Node</span>
             </div>
             <h1 className="text-4xl font-bold font-outfit">Autonomous Growth Dashboard</h1>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
             {['Overview', 'Funnel', 'AI Status', 'Data'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={cn(
                    "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                    activeTab === tab.toLowerCase() ? "bg-primary text-background shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
                  )}
                >
                  {tab}
                </button>
             ))}
          </div>
        </header>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {stats.kpis.map((kpi: any, i: number) => (
              <Card key={i} className="bg-[#111827] border-white/10 shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <kpi.icon className="w-16 h-16" />
                 </div>
                 <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                       <div className={cn("p-2 rounded-xl bg-white/5", kpi.color)}>
                          <kpi.icon className="w-5 h-5" />
                       </div>
                       <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {kpi.trend}
                       </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-1">{kpi.label}</p>
                    <h3 className="text-3xl font-black font-space-mono">{kpi.value}</h3>
                 </CardContent>
              </Card>
           ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
           {/* Section 2: Conversion Funnel */}
           <Card className="lg:col-span-8 bg-[#111827] border-white/10 p-8 shadow-2xl">
              <CardHeader className="px-0 pt-0 pb-10">
                 <CardTitle className="flex items-center text-xl font-bold">
                    <Layers className="w-5 h-5 mr-3 text-primary" /> Lifecycle Conversion Funnel
                 </CardTitle>
              </CardHeader>
              <div className="h-[400px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                       <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#fbbf24' }}
                       />
                       <Funnel
                          data={stats.funnelData}
                          dataKey="value"
                          nameKey="name"
                       >
                          <LabelList position="right" fill="#94a3b8" stroke="none" dataKey="name" />
                          {stats.funnelData.map((entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.8} />
                          ))}
                       </Funnel>
                    </FunnelChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           {/* Section 3: AI Agent Status */}
           <Card className="lg:col-span-4 bg-[#111827] border-white/10 p-8 shadow-2xl space-y-8">
              <CardHeader className="px-0 pt-0">
                 <CardTitle className="flex items-center text-xl font-bold">
                    <Sparkles className="w-5 h-5 mr-3 text-primary" /> AI Agent Observability
                 </CardTitle>
              </CardHeader>
              <div className="space-y-6">
                 {[
                    { name: 'Content Engine', status: 'Healthy', action: 'Daily Blog', icon: FileText, color: 'text-blue-500' },
                    { name: 'Nudge Engine', status: 'Active', action: 'Lifecycle Re-engagement', icon: Zap, color: 'text-amber-500' },
                    { name: 'Personalize Engine', status: 'Real-time', action: 'Dashboard Nurture', icon: LayoutDashboard, color: 'text-emerald-500' },
                    { name: 'Conversion Bot', status: 'Ready', action: 'Loan Triggering', icon: Banknote, color: 'text-primary' },
                 ].map((agent, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all">
                       <div className="flex items-center space-x-3">
                          <div className={cn("p-2 rounded-lg bg-white/5", agent.color)}>
                             <agent.icon className="w-4 h-4" />
                          </div>
                          <div>
                             <p className="text-sm font-bold leading-none">{agent.name}</p>
                             <p className="text-[10px] text-muted-foreground font-mono mt-1">{agent.action}</p>
                          </div>
                       </div>
                       <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                          <span className="text-[10px] font-bold text-emerald-500 font-mono tracking-tighter uppercase">{agent.status}</span>
                       </div>
                    </div>
                 ))}
              </div>
              <Button className="w-full h-12 bg-white/5 border-white/10 hover:bg-white/10 font-bold font-mono text-xs uppercase tracking-widest group">
                 Run Manual Agent Sync <ArrowUpRight className="ml-2 w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
           </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
           {/* Section 4: Country Trends */}
           <Card className="bg-[#111827] border-white/10 p-8 shadow-2xl">
              <CardHeader className="px-0 pt-0 pb-6">
                 <CardTitle className="text-lg font-bold flex items-center">
                    <Target className="w-5 h-5 mr-3 text-blue-500" /> Geography Heatmap
                 </CardTitle>
              </CardHeader>
              <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.countryData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                       <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                       <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                       <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#111827', borderColor: '#334155' }} />
                       <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {stats.countryData.map((entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#3b82f6'} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           {/* Section 5: Recent AI Content */}
           <Card className="bg-[#111827] border-white/10 p-8 shadow-2xl">
              <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between">
                 <CardTitle className="text-lg font-bold flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-primary" /> Recent AI Content
                 </CardTitle>
                 <Button variant="ghost" className="text-[10px] font-mono text-primary underline">VIEW ALL</Button>
              </CardHeader>
              <div className="space-y-4">
                 {stats.blogs.map((blog: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                       <div className="flex flex-col space-y-1 max-w-[70%]">
                          <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">{blog.title}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{blog.date}</span>
                       </div>
                       <div className="flex items-center space-x-4">
                          <div className="text-right">
                             <p className="text-[10px] font-mono text-muted-foreground">VIEWS</p>
                             <p className="text-sm font-bold font-space-mono">{blog.views}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                       </div>
                    </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
