"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  GraduationCap, 
  Globe, 
  Target, 
  Wallet,
  Zap,
  TrendingUp,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { awardXP } from "@/lib/gamification";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useFormPersist } from "@/hooks/useFormPersist";
import { useUnsavedWarning } from "@/hooks/useUnsavedWarning";
import Link from 'next/link';

const STAGES = [
  { id: 'explore', label: 'Just starting to explore', icon: Globe },
  { id: 'shortlist', label: 'Narrowing down universities', icon: Target },
  { id: 'apply', label: 'Actively applying', icon: GraduationCap },
  { id: 'loan', label: 'Loan hunting', icon: Wallet },
];

const COUNTRIES = [
  { id: 'usa', label: 'USA 🇺🇸' },
  { id: 'uk', label: 'UK 🇬🇧' },
  { id: 'canada', label: 'Canada 🇨🇦' },
  { id: 'germany', label: 'Germany 🇩🇪' },
  { id: 'australia', label: 'Australia 🇦🇺' },
];

const INITIAL_FORM_DATA = {
  name: "",
  stage: "",
  degree: "",
  field: "",
  gpa: 3.5,
  graduationYear: 2024,
  targetCountries: [] as string[],
  timeline: "",
  budget: 50000
};

export default function OnboardingPage() {
  const [formData, setFormData, clearPersist, wasRestored] = useFormPersist("onboarding_data", INITIAL_FORM_DATA);
  const [step, setStep] = useState(1);

  const [isLoading, setIsLoading] = useState(false);

  // Unsaved Warning
  useUnsavedWarning(step > 1 && step < 5);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_profiles').update({
           name: formData.name,
           current_degree: formData.degree,
           graduation_year: formData.graduationYear,
           gpa: formData.gpa,
           target_countries: formData.targetCountries,
           budget_usd: formData.budget,
           onboarding_complete: true
        }).eq('id', user.id);
        
        await awardXP(user.id, 'PROFILE_COMPLETE');
      } else {
        // Fallback for demo
        localStorage.setItem('eduverse_xp', '100');
        localStorage.setItem('eduverse_onboarding', 'true');
      }
      clearPersist();
      toast.success("Profile complete!", { description: "+100 XP Earned" });
      nextStep(); // To celebration step
    } catch (err) {
      toast.error("Error saving profile");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCountry = (id: string) => {
    setFormData({
      targetCountries: formData.targetCountries.includes(id)
        ? formData.targetCountries.filter(c => c !== id)
        : [...formData.targetCountries, id]
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 pt-20">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
         <motion.div 
            className="h-full bg-primary shadow-[0_0_15px_#f59e0b]"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / 4) * 100}%` }}
         />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1" 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl space-y-10"
          >
            <div className="text-center space-y-4">
               <h1 className="text-4xl font-black text-white font-outfit">Hello! Let's set up your profile</h1>
               <p className="text-muted-foreground">Tell us a bit about where you are in your journey.</p>
            </div>

            {wasRestored && step === 1 && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary">Welcome back! We've restored your progress.</span>
                </div>
                <button 
                  onClick={clearPersist}
                  className="text-[10px] font-mono text-muted-foreground hover:text-white transition-colors"
                >
                  START OVER
                </button>
              </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <Label className="text-xs font-mono uppercase text-muted-foreground">Your Full Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({ name: e.target.value })}
                    className="bg-white/5 border-white/10 h-14 text-lg" 
                    placeholder="e.g. Priyanshu Sharma"
                  />
               </div>
               <div className="space-y-4">
                   <Label className="text-xs font-mono uppercase text-muted-foreground">Where are you now?</Label>
                   <div className="grid grid-cols-1 gap-3">
                      {STAGES.map(s => (
                        <button 
                            key={s.id}
                            onClick={() => setFormData({ stage: s.id })}
                            className={cn(
                                "flex items-center space-x-4 p-4 rounded-xl border transition-all text-left",
                                formData.stage === s.id ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/20"
                            )}
                        >
                           <s.icon className="w-5 h-5 shrink-0" />
                           <span className="text-sm font-bold">{s.label}</span>
                        </button>
                      ))}
                   </div>
               </div>
            </div>

            <div className="flex justify-end">
               <Button onClick={nextStep} disabled={!formData.name || !formData.stage} className="bg-primary text-background font-bold h-14 px-10 rounded-2xl">
                  Next Step <ArrowRight className="ml-2 w-5 h-5" />
               </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2" 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-2xl space-y-10"
          >
            <div className="text-center space-y-2">
               <h2 className="text-3xl font-bold text-white font-outfit">Academic Background</h2>
               <p className="text-muted-foreground">This helps us predict your admission odds.</p>
            </div>

            <Card className="bg-[#111827] border-white/10 p-8">
               <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <Label className="text-xs font-mono text-muted-foreground">CURRENT DEGREE</Label>
                        <Input value={formData.degree} onChange={e=>setFormData({ degree: e.target.value })} className="bg-white/5 border-white/10" placeholder="e.g. B.Tech Computer Science" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs font-mono text-muted-foreground">GRADUATION YEAR</Label>
                        <Select value={formData.graduationYear.toString()} onValueChange={v=>setFormData({ graduationYear: parseInt(v || "2024") || 2024 })}>
                           <SelectTrigger className="bg-white/5 border-white/10">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-[#111827] border-white/10 text-white">
                              {[2023, 2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <div className="space-y-4">
                        <div className="flex justify-between items-center">
                           <Label className="text-xs font-mono text-muted-foreground">GPA / PERCENTAGE</Label>
                           <span className="text-primary font-bold font-space-mono text-xl">{formData.gpa.toFixed(1)}</span>
                        </div>
                        <Slider 
                           value={[formData.gpa]} min={2} max={10} step={0.1}
                           onValueChange={(v) => setFormData({ gpa: Array.isArray(v) ? v[0] : v })}
                        />
                        <p className="text-[10px] text-muted-foreground text-center">Slide to your actual GPA (out of 10.0)</p>
                     </div>
                  </div>
               </div>
            </Card>

            <div className="flex justify-between">
               <Button variant="ghost" onClick={prevStep} className="text-muted-foreground hover:text-white">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
               </Button>
               <Button onClick={nextStep} disabled={!formData.degree} className="bg-primary text-background font-bold h-14 px-10 rounded-2xl shadow-xl shadow-primary/20">
                  Almost Done <ArrowRight className="ml-2 w-5 h-5" />
               </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
            <motion.div 
                key="step3" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-2xl space-y-10"
            >
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-white font-outfit">Your Goals</h2>
                    <p className="text-muted-foreground">Where and when do you want to fly?</p>
                </div>

                <div className="grid gap-10">
                    <div className="space-y-4">
                        <Label className="text-xs font-mono uppercase text-muted-foreground flex items-center">
                            <MapPin className="w-3 h-3 mr-2" /> Target Countries
                        </Label>
                        <div className="flex flex-wrap gap-4">
                            {COUNTRIES.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => toggleCountry(c.id)}
                                    className={cn(
                                        "px-6 py-3 rounded-full border text-sm font-bold transition-all",
                                        formData.targetCountries.includes(c.id) ? "bg-primary text-background border-primary" : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/20"
                                    )}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Label className="text-xs font-mono uppercase text-muted-foreground">Timeline</Label>
                        <Select value={formData.timeline} onValueChange={v => setFormData({ timeline: v || "" })}>
                                <SelectTrigger className="bg-white/5 border-white/10 h-14">
                                    <SelectValue placeholder="Select Intake" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#111827] border-white/10 text-white">
                                    <SelectItem value="jan2025">January 2025</SelectItem>
                                    <SelectItem value="sep2025">September 2025</SelectItem>
                                    <SelectItem value="jan2026">January 2026</SelectItem>
                                    <SelectItem value="sep2026">September 2026</SelectItem>
                                    <SelectItem value="unsure">Not sure yet</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-mono uppercase text-muted-foreground">Total Budget</Label>
                                <span className="text-primary font-bold font-space-mono text-xl">${formData.budget.toLocaleString()}</span>
                            </div>
                            <Slider 
                                value={[formData.budget]} min={10000} max={200000} step={5000}
                                onValueChange={(v) => setFormData({ budget: Array.isArray(v) ? v[0] : v })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between">
                    <Button variant="ghost" onClick={prevStep} className="text-muted-foreground hover:text-white">
                        <ArrowLeft className="mr-2 w-4 h-4" /> Back
                    </Button>
                    <Button onClick={handleFinish} disabled={isLoading || formData.targetCountries.length === 0} className="bg-primary text-background font-bold h-14 px-10 rounded-2xl shadow-xl shadow-primary/20">
                        {isLoading ? "Saving..." : "Finish Setup"} <CheckCircle2 className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </motion.div>
        )}

        {step === 4 && (
            <motion.div 
                key="step4" 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg text-center space-y-12"
            >
                <div className="relative">
                   <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                   <div className="relative z-10 w-24 h-24 rounded-3xl bg-primary flex items-center justify-center mx-auto shadow-2xl shadow-primary/20">
                      <Zap className="w-12 h-12 text-background" />
                   </div>
                </div>

                <div className="space-y-4">
                   <h2 className="text-5xl font-black text-white font-outfit">Welcome!</h2>
                   <div className="flex items-center justify-center space-x-3">
                      <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-sm">
                         +100 XP REWARD EARNED
                      </div>
                   </div>
                   <p className="text-xl text-muted-foreground">You're now a <span className="text-primary font-bold font-space-mono underline">Level 1 Explorer</span>! 🚀</p>
                </div>

                <div className="grid grid-cols-1 gap-4 text-left">
                   <p className="text-xs font-mono text-muted-foreground uppercase opacity-50 px-2 tracking-widest">Recommended Next Actions</p>
                   {[
                      { icon: GraduationCap, text: "Explore career matches in the Navigator", href: "/career-navigator" },
                      { icon: TrendingUp, text: "Calculate the ROI of your dream degree", href: "/roi-calculator" },
                      { icon: Zap, text: "Ask your AI Mentor for a timeline check", href: "/mentor-chat" },
                   ].map((action, i) => (
                      <Link key={i} href={action.href} className="flex items-center p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/40 transition-all group">
                         <action.icon className="w-6 h-6 text-primary mr-4 group-hover:scale-110 transition-transform" />
                         <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{action.text}</span>
                         <ArrowRight className="ml-auto w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                      </Link>
                   ))}
                </div>

                <Link href="/dashboard" className="block w-full">
                    <Button className="w-full h-14 bg-white text-background font-black text-lg hover:bg-white/90 shadow-2xl">
                       GO TO DASHBOARD
                    </Button>
                </Link>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
