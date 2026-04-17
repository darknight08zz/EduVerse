"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { awardXP } from "@/lib/gamification";

interface AddShortlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  university: {
    name: string;
    program: string;
    country: string;
    tuition?: number | string;
    ranking?: string;
    fitScore?: number;
  };
}

export function AddShortlistModal({ isOpen, onClose, university }: AddShortlistModalProps) {
  const [formData, setFormData] = useState({
    deadline: "",
    notes: "",
    status: "researching"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const suggestDeadline = async () => {
    setIsAiLoading(true);
    try {
      const resp = await fetch('/api/gemini/deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          universityName: university.name, 
          program: university.program 
        })
      });
      const data = await resp.json();
      if (data.deadline) {
        setFormData(p => ({ ...p, deadline: data.deadline }));
        toast.info("AI suggested a deadline based on typical intake patterns.");
      } else {
        toast.error("AI couldn't find a specific deadline. Check the official site.");
      }
    } catch (e) {
      toast.error("Failed to fetch AI suggestion.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase.from('university_shortlist').insert({
        user_id: user.id,
        university_name: university.name,
        program: university.program,
        country: university.country,
        tuition_usd: typeof university.tuition === 'number' ? university.tuition : parseInt(String(university.tuition).replace(/[^0-9]/g, '')) || 0,
        ranking: university.ranking,
        fit_score: university.fitScore,
        application_deadline: formData.deadline || null,
        notes: formData.notes,
        status: formData.status
      });

      if (error) throw error;

      await awardXP(user.id, "SHORTLIST_UNIVERSITY");
      toast.success("🎯 +15 XP — University Shortlisted!", {
        description: `${university.name} added to your application board.`
      });
      onClose();
    } catch (error: any) {
      toast.error("Failed to add to shortlist", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-outfit">Confirm Shortlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <p className="text-xs font-mono text-primary uppercase tracking-widest">{university.country}</p>
            <h3 className="text-lg font-bold">{university.name}</h3>
            <p className="text-sm text-muted-foreground">{university.program}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-mono uppercase text-muted-foreground">Application Deadline</Label>
                <button 
                  onClick={suggestDeadline}
                  className="text-[10px] font-mono text-primary flex items-center hover:underline disabled:opacity-50"
                  disabled={isAiLoading}
                >
                  {isAiLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                  SUGGEST TYPICAL DEADLINE
                </button>
              </div>
              <Input 
                type="date" 
                value={formData.deadline}
                onChange={(e) => setFormData(p => ({ ...p, deadline: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase text-muted-foreground">Internal Notes</Label>
              <Textarea 
                placeholder="e.g. Focus on ML electives, Check for Indian alumni network..."
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                className="bg-white/5 border-white/10 min-h-[100px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-primary text-background font-bold px-8 shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Confirm Shortlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
