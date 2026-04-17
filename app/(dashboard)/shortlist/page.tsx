"use client";

import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { ShortlistColumn } from "@/components/shortlist/ShortlistColumn";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  Loader2, 
  Trophy, 
  Target, 
  Calendar, 
  CheckCircle2, 
  Zap,
  TrendingUp,
  LayoutGrid
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { awardXP } from "@/lib/gamification";
import confetti from "canvas-confetti";

const COLUMNS = [
  { id: "researching", title: "Researching" },
  { id: "preparing", title: "Preparing" },
  { id: "applied", title: "Applied" },
  { id: "waitlisted", title: "Waitlisted" },
  { id: "accepted", title: "Accepted" }
];

import { useDemoMode } from "@/contexts/DemoContext";

interface ShortlistItem {
  id: string;
  university_name: string;
  program: string;
  status: string;
  application_deadline: string | null;
  created_at: string;
}

export default function ShortlistPage() {
  const { isDemoMode, demoShortlist } = useDemoMode();
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (isDemoMode) {
      setItems(demoShortlist);
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('university_shortlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err: unknown) {
      toast.error("Failed to load shortlist", { 
        description: err instanceof Error ? err.message : "An unknown error occurred" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    // Optimistic Update
    const updatedItems = items.map(item => 
      item.id === draggableId ? { ...item, status: newStatus } : item
    );
    setItems(updatedItems);

    try {
      const { error } = await supabase
        .from('university_shortlist')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', draggableId);

      if (error) throw error;

      // Gamification & Feedback
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (newStatus === 'applied' && oldStatus !== 'applied') {
        await awardXP(user.id, "APPLIED_UNIVERSITY");
        toast.success("🚀 +75 XP — You're in the game!", { description: "First application marked as applied." });
      } else if (newStatus === 'accepted') {
        await awardXP(user.id, "ACCEPTED_ADMIT");
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ffffff', '#10b981']
        });
        toast.success("🏆 +200 XP — ADMITTED!", { description: "Congratulations on your acceptance!" });
      }
    } catch (err: unknown) {
      toast.error("Failed to update status");
      loadData(); // Revert
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('university_shortlist').delete().eq('id', id);
      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
      toast.success("University removed from shortlist");
    } catch (err: unknown) {
      toast.error("Failed to remove item");
    }
  };

  const nextDeadline = items
    .filter(i => i.application_deadline)
    .sort((a, b) => {
      const dateA = a.application_deadline ? new Date(a.application_deadline).getTime() : 0;
      const dateB = b.application_deadline ? new Date(b.application_deadline).getTime() : 0;
      return dateA - dateB;
    })[0];

  const acceptanceRate = items.filter(i => i.status === 'accepted').length / 
    (items.filter(i => ['applied', 'waitlisted', 'accepted', 'rejected'].includes(i.status)).length || 1);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Synchronizing Application Board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-outfit text-white tracking-tight">University Shortlist</h1>
          <p className="text-muted-foreground font-mono text-sm max-w-2xl">
            Track your application lifecycle from initial research to final admit. Drag cards to update your progress.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
           <Badge variant="outline" className="h-10 border-white/10 px-4 flex items-center bg-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              {items.length} UNIVERSITIES
           </Badge>
           <Badge variant="outline" className="h-10 border-white/10 px-4 flex items-center bg-white/5">
              <span className="w-2 h-2 rounded-full bg-primary mr-2" />
              FALL '25 SEASON
           </Badge>
        </div>
      </header>

      {/* Season at a Glance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: "Shortlisted", value: items.length, icon: Target, color: "text-primary" },
           { label: "Applied", value: items.filter(i => i.status === 'applied' || i.status === 'accepted').length, icon: CheckCircle2, color: "text-emerald-500" },
           { label: "Next Deadline", value: (nextDeadline && nextDeadline.application_deadline) ? new Date(nextDeadline.application_deadline).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "--", icon: Calendar, color: "text-amber-500" },
           { label: "Acceptance Rate", value: `${Math.round(acceptanceRate * 100)}%`, icon: TrendingUp, color: "text-blue-500" },
         ].map((stat, i) => (
           <Card key={i} className="bg-[#111827] border-white/10">
             <CardContent className="p-5 flex items-center space-x-4">
               <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                 <stat.icon className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                 <p className="text-xl font-black text-white font-space-mono leading-none">{stat.value}</p>
               </div>
             </CardContent>
           </Card>
         ))}
      </div>

      <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 min-w-max px-2">
            {COLUMNS.map(col => (
              <ShortlistColumn 
                key={col.id}
                id={col.id}
                title={col.title}
                items={items.filter(item => item.status === col.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {items.length === 0 && (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-20 text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
             <LayoutGrid className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Your shortlist is empty</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Start your journey in the Career Navigator to find universities that match your profile.
            </p>
          </div>
          <a href="/career-navigator">
            <button className="bg-primary text-background font-bold px-8 py-3 rounded-xl shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)]">
              Explore Universities
            </button>
          </a>
        </div>
      )}
    </div>
  );
}
