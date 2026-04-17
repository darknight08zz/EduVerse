"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PenTool, 
  Sparkles, 
  Loader2, 
  Download, 
  Copy, 
  RefreshCw, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight,
  BookOpen,
  History,
  Type,
  UserCircle,
  FileText,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { awardXP } from "@/lib/gamification";
import { exportToDocx, exportToTxt } from "@/lib/sop-export";
import { cn } from "@/lib/utils";
import { apiPost, apiStream } from "@/lib/api-client";
import { useFormPersist } from "@/hooks/useFormPersist";
import { useUnsavedWarning } from "@/hooks/useUnsavedWarning";
import { useAILoadingMessages } from "@/hooks/useAILoadingMessages";
import { useDemoMode } from "@/contexts/DemoContext";

const STAGES = [
  "Analyzing your profile...",
  "Understanding program requirements...",
  "Crafting your opening hook...",
  "Building your academic narrative...",
  "Connecting to your career goals..."
];

const INITIAL_SOP_DATA = {
  university: "",
  program: "",
  whyUniversity: "",
  intake: "Fall 2025",
  relevantExperience: "",
  problemStatement: "",
  achievement: "",
  fiveYearGoal: ""
};

export default function SOPCopilot() {
  const { isDemoMode, demoProfile, demoShortlist } = useDemoMode();
  
  const [sopData, setSopData, clearPersist, wasRestored] = useFormPersist("sop_data", INITIAL_SOP_DATA);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<any>(null);
  const [shortlist, setShortlist] = useState<any[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [generatedSOP, setGeneratedSOP] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);

  // Unsaved Warning
  useUnsavedWarning(step > 1 && step < 4 && !generatedSOP);

  useEffect(() => {
    const loadData = async () => {
      if (isDemoMode) {
        setProfile(demoProfile);
        
        if (!wasRestored) {
          setSopData({
            university: "University of California, San Diego",
            program: "MS Computer Science",
            whyUniversity: "UCSD's focus on Artificial Intelligence and its proximity to the La Jolla tech hub aligns with my goal of building scalable AI systems.",
            intake: "Fall 2025",
            relevantExperience: "6-month backend internship at Infosys working with Java/Spring Boot.",
            problemStatement: "The lack of efficient automated reasoning in enterprise backend systems.",
            achievement: "Reduced API latency by 40% during my internship through database query optimization.",
            fiveYearGoal: "Lead an AI engineering team at a silicon valley startup."
          });
        }
        
        setVersions([
           {
              id: 'demo-sop-1',
              university: 'Carnegie Mellon University',
              program: 'MS in Software Engineering',
              content: "I have always been fascinated by the intersection of distributed systems and developer productivity...",
              version: 1,
              created_at: new Date(Date.now() - 172800000).toISOString()
           }
        ]);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      setProfile(profile);

      const { data: shortlist } = await supabase.from('university_shortlist').select('*').eq('user_id', user.id);
      setShortlist(shortlist || []);

      const { data: existingDrafts } = await supabase
        .from('sop_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setVersions(existingDrafts || []);
    };
    loadData();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedSOP("");
    setGenerationStage(0);

    const interval = setInterval(() => {
      setGenerationStage(prev => {
        if (prev < STAGES.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1200);

    if (isDemoMode) {
      // Simulate Streaming
      const demoSOP = `To the Admissions Committee,\n\nMy journey as a software engineer at Infosys has been defined by a deep-seated curiosity about how complex backend systems can be optimized for real-world impact. During my six-month internship, I was tasked with a challenge that many engineers face: API latency. By optimizing database queries, I managed to reduce this latency by 40%, a feat that not only improved system efficiency but also sparked my passion for scalable software architecture.\n\nI am particularly drawn to the MS in Computer Science program at the University of California, San Diego because of its world-class faculty and proximity to a thriving tech ecosystem. I am eager to contribute to the research being done at the intersection of AI and systems engineering, particularly in how we can use automated reasoning to simplify enterprise backend management.\n\nPost-graduation, I see myself leading an AI engineering team at a Silicon Valley startup, where I can apply the rigorous technical training I receive at UCSD to build the next generation of intelligent software solutions. Thank you for considering my application.\n\nSincerely,\nArjun Sharma`;
      
      const words = demoSOP.split(" ");
      let currentText = "";
      for (const word of words) {
        currentText += word + " ";
        setGeneratedSOP(currentText);
        await new Promise(r => setTimeout(r, 50));
      }
      
      setVersions([{
        id: 'demo-sop-new',
        university: sopData.university,
        program: sopData.program,
        content: demoSOP,
        version: versions.length + 1,
        created_at: new Date().toISOString()
      }, ...versions]);

      setFeedback({
        overallScore: 88,
        strengths: ["Strong technical hook", "Clearly defined career goals", "Localized context to UCSD"],
        improvements: ["Mention specific faculty members", "Elaborate more on undergraduate course synergy"]
      });

      setIsGenerating(false);
      setStep(4);
      return;
    }

    try {
      const stream = await apiStream('/api/gemini/sop', { profile, sopData });
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      let fullText = "";
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        setGeneratedSOP(fullText);
      }

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: newDraft } = await supabase.from('sop_drafts').insert({
          user_id: user.id,
          university: sopData.university,
          program: sopData.program,
          content: fullText,
          version: versions.length + 1
        }).select().single();
        
        if (newDraft) setVersions([newDraft, ...versions]);
      }

      await awardXP(profile.id, "WRITER");
      toast.success("✍️ +100 XP — SOP Draft Created!");
      
      fetchFeedback(fullText);
      setStep(4);
    } catch (error: any) {
      toast.error(error.message || "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
      clearInterval(interval);
    }
  };

  const fetchFeedback = async (content: string) => {
    if (isDemoMode) return;
    try {
      const data = await apiPost<any>('/api/gemini/sop-feedback', { 
        sopText: content, 
        university: sopData.university, 
        program: sopData.program 
      });
      setFeedback(data);
      if (data && (data as any).overallScore > 80) {
        await awardXP(profile.id, "STRONG_APPLICANT");
      }
    } catch (e) {
      console.error("Feedback error:", e);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSOP);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold font-outfit text-white tracking-tight flex items-center">
          AI SOP Copilot <Badge className="ml-4 bg-primary text-background font-bold h-6 animate-pulse">NEW</Badge>
        </h1>
        <p className="text-muted-foreground font-mono text-sm max-w-2xl uppercase tracking-widest">
          Guided synthesis of your academic narrative into a premium admission-ready draft.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid lg:grid-cols-12 gap-8"
          >
            <Card className="lg:col-span-8 bg-[#111827] border-white/10 p-8 space-y-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                <h2 className="text-2xl font-bold font-outfit">Target Selection</h2>
              </div>

              {wasRestored && !generatedSOP && step === 1 && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-primary">Your SOP progress has been restored.</span>
                  </div>
                  <button 
                    onClick={clearPersist}
                    className="text-[10px] font-mono text-muted-foreground hover:text-white transition-colors"
                  >
                    RESET FORM
                  </button>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">University Name</Label>
                  <Input 
                    value={sopData.university} 
                    onChange={e => setSopData({...sopData, university: e.target.value})}
                    placeholder="e.g. Stanford University"
                    className="bg-white/5 border-white/10 h-12"
                  />
                  {shortlist.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {shortlist.slice(0, 3).map(uni => (
                        <button 
                          key={uni.id}
                          onClick={() => setSopData({...sopData, university: uni.university_name, program: uni.program})}
                          className="text-[9px] px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                        >
                          + {uni.university_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Program Name</Label>
                  <Input 
                    value={sopData.program} 
                    onChange={e => setSopData({...sopData, program: e.target.value})}
                    placeholder="e.g. MS in Computer Science"
                    className="bg-white/5 border-white/10 h-12"
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Why this specific program?</Label>
                  <Textarea 
                    value={sopData.whyUniversity} 
                    onChange={e => setSopData({...sopData, whyUniversity: e.target.value})}
                    placeholder="What specifically attracts you to this university's curriculum or research?"
                    className="bg-white/5 border-white/10 min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-white/5">
                <Button 
                   onClick={() => setStep(2)} 
                   disabled={!sopData.university || !sopData.program}
                   className="bg-primary text-background font-bold px-8 h-12"
                >
                  Next: Your Story <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </Card>

            <div className="lg:col-span-4 space-y-6">
               <Card className="bg-primary/5 border-primary/20 p-6">
                  <h3 className="font-bold flex items-center text-primary mb-4">
                    <Sparkles className="w-5 h-5 mr-2 fill-primary" /> Multi-Agent Writing
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Unlike generic templates, our Copilot uses agentic prompts to synthesize your local context with global admission standards.
                  </p>
               </Card>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-3xl mx-auto"
          >
            <Card className="bg-[#111827] border-white/10 p-8 space-y-8">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                    <h2 className="text-2xl font-bold font-outfit">Narrative Backbone</h2>
                 </div>
                 <span className="text-[10px] font-mono text-muted-foreground text-right border-r-2 border-primary pr-2">STEP 2 OF 3</span>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="text-sm font-bold">Relevant academic or professional experiences?</Label>
                  <Textarea 
                    value={sopData.relevantExperience} 
                    onChange={e => setSopData({relevantExperience: e.target.value})}
                    placeholder="Summarize the core experience that prepared you for this..."
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold">Problem or gap in your field you want to address?</Label>
                  <Textarea 
                    value={sopData.problemStatement} 
                    onChange={e => setSopData({problemStatement: e.target.value})}
                    placeholder="What real-world challenge motivates your study?"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold">A specific achievement you're most proud of?</Label>
                  <Textarea 
                    value={sopData.achievement} 
                    onChange={e => setSopData({achievement: e.target.value})}
                    placeholder="Mention a quantifyable impact or a hard problem solved..."
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-bold">Where do you see yourself in 5 years?</Label>
                  <Textarea 
                    value={sopData.fiveYearGoal} 
                    onChange={e => setSopData({fiveYearGoal: e.target.value})}
                    placeholder="What role or impact do you aim to have post-graduation?"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-8 border-t border-white/5">
                <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground">Back</Button>
                <Button onClick={() => setStep(3)} className="bg-primary text-background font-bold px-8 h-12">
                   Review Profile <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="bg-[#111827] border-white/10 p-10 text-center space-y-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-primary to-amber-500" />
               <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                  <UserCircle className="w-10 h-10 text-primary" />
               </div>
               
               <div className="space-y-2">
                 <h2 className="text-2xl font-bold font-outfit">Ready to Synthesize?</h2>
                 <p className="text-muted-foreground text-sm">We'll inject your academic profile into the SOP for maximum authenticity.</p>
               </div>

               <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                     <p className="text-[8px] font-mono text-muted-foreground uppercase mb-1">Background</p>
                     <p className="text-xs font-bold">{profile?.degree || "B.Tech"} in {profile?.field || "Computer Science"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                     <p className="text-[8px] font-mono text-muted-foreground uppercase mb-1">Score</p>
                     <p className="text-xs font-bold">GPA: {profile?.gpa || "8.5"} | GRE: {profile?.gre || "320"}</p>
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                    className="bg-primary text-background font-black text-lg h-16 rounded-2xl shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)] group"
                  >
                    {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 mr-2 group-hover:scale-120 transition-transform" />}
                    BEGIN AI GENERATION
                  </Button>
                  <Button variant="ghost" onClick={() => setStep(2)} className="text-muted-foreground text-xs uppercase font-mono tracking-widest">Wait, I want to edit my responses</Button>
               </div>
            </Card>

            {isGenerating && (
              <Card className="mt-8 bg-[#111827] border-white/10 p-8 space-y-6">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono text-primary font-bold tracking-widest uppercase">{STAGES[generationStage]}</span>
                    <span className="text-xs font-mono text-muted-foreground">{Math.round((generationStage + 1) / STAGES.length * 100)}%</span>
                 </div>
                 <Progress value={(generationStage + 1) / STAGES.length * 100} className="h-1 bg-white/5" />
                 <div className="grid grid-cols-5 gap-2">
                    {STAGES.map((_, i) => (
                       <div key={i} className={cn("h-1 rounded-full bg-white/10 transition-colors", i <= generationStage && "bg-primary")} />
                    ))}
                 </div>
              </Card>
            )}
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-12 gap-10"
          >
            <div className="lg:col-span-8 space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold font-outfit text-white">Your Statement of Purpose</h3>
                  <div className="flex items-center space-x-2">
                     <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 border-white/10 bg-white/5 text-[10px] font-mono">
                        <Copy className="w-3 h-3 mr-2" /> COPY
                     </Button>
                     <Button variant="outline" size="sm" onClick={() => exportToDocx(generatedSOP, sopData.university, sopData.program)} className="h-8 border-white/10 bg-white/5 text-[10px] font-mono">
                        <Download className="w-3 h-3 mr-2" /> DOCX
                     </Button>
                  </div>
               </div>

               <Card className="bg-white text-slate-900 shadow-2xl overflow-hidden shadow-primary/20">
                  <div className="h-1 bg-primary" />
                  <CardContent className="p-12 sm:p-20 font-serif leading-relaxed text-lg subpixel-antialiased">
                     <div className="text-center mb-12 space-y-4">
                        <h2 className="text-3xl font-bold tracking-tight">Statement of Purpose</h2>
                        <div className="flex items-center justify-center space-x-4 opacity-60 italic text-sm">
                           <span>{sopData.university}</span>
                           <span>•</span>
                           <span>{sopData.program}</span>
                        </div>
                     </div>
                     <div className="whitespace-pre-wrap selection:bg-primary selection:text-background">
                        {generatedSOP || <div className="h-96 flex items-center justify-center opacity-20 italic">Drafting in progress...</div>}
                     </div>
                  </CardContent>
               </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
               {/* Feedback Score Card */}
               <Card className="bg-[#111827] border-white/10 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <CardHeader className="pb-2">
                     <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center">
                        <TrendingUp className="w-3.5 h-3.5 mr-2 text-emerald-500" /> AI QUALITY SCORE
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                     <div className="flex items-end space-x-2">
                        <span className="text-5xl font-black font-space-mono text-white tracking-tighter">{feedback?.overallScore || "--"}</span>
                        <span className="text-muted-foreground font-mono text-sm mb-1.5">/ 100</span>
                     </div>
                     
                     <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                           <p className="text-[10px] font-mono uppercase text-emerald-500">Strengths</p>
                           {feedback?.strengths.map((s: string, i: number) => (
                              <div key={i} className="flex items-start text-xs text-white">
                                 <CheckCircle2 className="w-3 h-3 mr-2 text-emerald-500 mt-0.5 shrink-0" /> {s}
                              </div>
                           ))}
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-mono uppercase text-amber-500">Improvements</p>
                           {feedback?.improvements.map((s: string, i: number) => (
                              <div key={i} className="flex items-start text-xs text-white">
                                 <ChevronRight className="w-3 h-3 mr-2 text-amber-500 mt-0.5 shrink-0" /> {s}
                              </div>
                           ))}
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Version History */}
               <Card className="bg-[#111827] border-white/10">
                  <CardHeader>
                     <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center">
                        <History className="w-3.5 h-3.5 mr-2" /> DRAFT HISTORY
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                     <div className="divide-y divide-white/5">
                        {versions.map((v, i) => (
                           <button 
                             key={i} 
                             onClick={() => { setGeneratedSOP(v.content); setSopData({ university: v.university, program: v.program }); fetchFeedback(v.content); }}
                             className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                           >
                              <div className="flex flex-col">
                                 <span className="text-xs font-bold text-white">Version {v.version}</span>
                                 <span className="text-[9px] text-muted-foreground font-mono">{new Date(v.created_at).toLocaleDateString()} · {v.university}</span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-muted-foreground" />
                           </button>
                        ))}
                     </div>
                  </CardContent>
               </Card>

               <Button 
                variant="outline" 
                onClick={() => setStep(1)} 
                className="w-full border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
               >
                 <RefreshCw className="mr-2 w-4 h-4" /> Start New Prototype
               </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
