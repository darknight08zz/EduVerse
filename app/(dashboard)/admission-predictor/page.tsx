"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiPost } from "@/lib/api-client";
import { useDemoMode } from "@/contexts/DemoContext";
import { 
  GraduationCap,
  ChevronRight,
  Target,
  Award,
  TrendingUp,
  Zap,
  ShieldCheck,
  Briefcase,
  Code,
  FileText,
  AlertTriangle,
  Trophy,
  Share2
} from "lucide-react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import AILoadingState from "@/components/shared/AILoadingState";
import { cn } from "@/lib/utils";
import { awardXP } from "@/lib/gamification";
import { supabase } from "@/lib/supabase";

// Custom Semi-Circular Gauge Component
const ProbabilityGauge = ({ value }: { value: number }) => {
  const rotation = (value / 100) * 180 - 90;
  const color = value < 30 ? "#ef4444" : value < 60 ? "#f59e0b" : value < 85 ? "#10b981" : "#3b82f6";

  return (
    <div className="relative w-64 h-32 overflow-hidden mx-auto">
      <svg className="w-full h-full transform translate-y-2">
        <circle
          cx="128" cy="128" r="120"
          fill="none" stroke="#ffffff10" strokeWidth="16"
          strokeDasharray="377" strokeDashoffset="0"
          strokeLinecap="round"
        />
        <motion.circle
          cx="128" cy="128" r="120"
          fill="none" stroke={color} strokeWidth="16"
          strokeDasharray="377"
          initial={{ strokeDashoffset: 377 }}
          animate={{ strokeDashoffset: 377 - (377 * (value / 100) * 0.5) }}
          transition={{ duration: 2, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold font-outfit"
          style={{ color }}
        >
          {value}%
        </motion.span>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest leading-loose">Probability</span>
      </div>
    </div>
  );
};

interface RadarPoint {
  subject: string;
  A: number;
}

interface Improvement {
  action: string;
  boost: string;
}

interface AdmissionReport {
  probability: number;
  zone: 'reach' | 'moderate' | 'good' | 'strong';
  aiInsight: string;
  radarData: RadarPoint[];
  liftingUp: string[];
  draggingDown: string[];
  improvements: Improvement[];
}

export default function AdmissionPredictor() {
  const { isDemoMode, demoProfile } = useDemoMode();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AdmissionReport | null>(null);

  const [form, setForm] = useState({
    uniName: "",
    programName: "",
    round: "Regular Decision",
    gpa: "3.8",
    gre: "320",
    english: "IELTS 7.5",
    research: false,
    publications: false,
    faangIntern: false,
    openSource: false,
    hackathons: false
  });

  useEffect(() => {
    if (isDemoMode) {
      setForm(prev => ({
        ...prev,
        uniName: "University of California, San Diego",
        programName: "MS Computer Science",
        gpa: demoProfile.gpa.toString(),
        gre: demoProfile.gre.toString(),
        english: `IELTS ${demoProfile.ielts}`,
        faangIntern: true,
      }));
    }
  }, [isDemoMode, demoProfile]);

  const handlePredict = async () => {
    setIsAnalyzing(true);
    
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 2000));
      setReport({
        probability: 74,
        zone: "moderate",
        aiInsight: "Arjun, your Infosys internship and 8.4 GPA make you a competitive 'Moderate' match. UCSD values technical depth, which your profile shows.",
        radarData: [
          { subject: 'Academic', A: 84 },
          { subject: 'Research', A: 40 },
          { subject: 'Work Exp', A: 75 },
          { subject: 'Technical', A: 90 },
          { subject: 'Scores', A: 82 },
          { subject: 'Diversity', A: 60 },
        ],
        liftingUp: [
          "Strong GPA (8.4/10) from a recognized technical background.",
          "Solid GRE score (318) meets the typical threshold for UC schools.",
          "Relevant industry internship provides an edge over pure academic profiles."
        ],
        draggingDown: [
          "Limited research publications for a research-heavy program like UCSD's MS CS.",
          "Highly competitive applicant pool for Fall '25 intake.",
          "Work experience is under 2 years, which is the sweet spot for some MS programs."
        ],
        improvements: [
          { action: "Optimize SOP Narrative", boost: "+8%" },
          { action: "Secure Strong Industry LoRs", boost: "+5%" },
          { action: "Highlight Open Source contributions", boost: "+4%" }
        ]
      });
      setIsAnalyzing(false);
      return;
    }

    try {
      const data = await apiPost<AdmissionReport>('/api/gemini/admission', { profile: form });
      setReport(data);
      if (!isDemoMode) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await awardXP(user.id, 'ADMISSION_PREDICTOR');
      }
      toast.success("🎯 +35 XP — Strategic Applicant Badge Unlocked!", {
        description: "Your comprehensive admission report is ready.",
      });
    } catch (err: unknown) {
      console.error(err);
      toast.error("Prediction failed", {
        description: err instanceof Error ? err.message : "The admissions AI engine is currently busy."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold font-outfit text-white tracking-tight">Admit Match Heuristics</h1>
        <p className="text-muted-foreground font-mono text-sm max-w-2xl">
          Advanced probability modeling for top global research institutions and professional masters.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {!report && !isAnalyzing ? (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <Card className="bg-[#111827] border-white/10 overflow-hidden shadow-2xl">
              <div className="grid lg:grid-cols-12">
                {/* Form Side */}
                <div className="lg:col-span-8 p-8 space-y-8 border-r border-white/5">
                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Target Institution</Label>
                        <Input 
                          placeholder="e.g. Stanford University" 
                          className="bg-white/5 border-white/10 h-12"
                          value={form.uniName}
                          onChange={(e) => setForm(p => ({ ...p, uniName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Target Program</Label>
                        <Input 
                          placeholder="e.g. MS in Computer Science" 
                          className="bg-white/5 border-white/10 h-12"
                          value={form.programName}
                          onChange={(e) => setForm(p => ({ ...p, programName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Application Round</Label>
                        <Select defaultValue="Regular Decision" onValueChange={(v: string | null) => v && setForm(p => ({ ...p, round: v }))}>
                           <SelectTrigger className="bg-white/5 border-white/10 h-12">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="bg-[#111827] border-white/10">
                              <SelectItem value="Early Decision">Early Decision</SelectItem>
                              <SelectItem value="Early Action">Early Action</SelectItem>
                              <SelectItem value="Regular Decision">Regular Decision</SelectItem>
                              <SelectItem value="Rolling Admissions">Rolling Admissions</SelectItem>
                           </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-4">
                            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">GPA</Label>
                            <Input 
                              placeholder="3.9" 
                              className="bg-white/5 border-white/10 h-12"
                              value={form.gpa}
                              onChange={(e) => setForm(p => ({ ...p, gpa: e.target.value }))}
                            />
                         </div>
                         <div className="space-y-4">
                            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">GRE</Label>
                            <Input 
                              placeholder="325" 
                              className="bg-white/5 border-white/10 h-12"
                              value={form.gre}
                              onChange={(e) => setForm(p => ({ ...p, gre: e.target.value }))}
                            />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6 pt-4 border-t border-white/5">
                      <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Application Strength Extras</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { id: "research", label: "Research Papers", icon: FileText },
                          { id: "publications", label: "Journal Publications", icon: Award },
                          { id: "faangIntern", label: "FAANG Internship", icon: Briefcase },
                          { id: "openSource", label: "OSS Contributions", icon: Code },
                          { id: "hackathons", label: "Hackathon Wins", icon: Trophy },
                        ].map((item) => (
                          <div key={item.id} className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-colors">
                            <Checkbox 
                              id={item.id} 
                              onCheckedChange={(v: boolean) => setForm(p => ({ ...p, [item.id]: !!v }))}
                              className="border-white/20 data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor={item.id} className="text-xs font-bold leading-none cursor-pointer flex items-center">
                               <item.icon className="w-3 h-3 mr-2 text-primary" /> {item.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                   </div>

                   <Button 
                    onClick={handlePredict}
                    className="w-full h-14 bg-primary text-background font-bold text-lg mt-8 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]"
                   >
                     Predict Admission Odds <ChevronRight className="ml-2 w-5 h-5" />
                   </Button>
                </div>

                {/* Illustration/Info Side */}
                <div className="lg:col-span-4 p-8 bg-white/[0.02] flex flex-col justify-center text-center space-y-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                      <Target className="w-64 h-64" />
                   </div>
                   <div className="space-y-4 relative z-10">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                         <Zap className="w-10 h-10 text-primary fill-primary/20" />
                      </div>
                      <h3 className="text-2xl font-bold font-outfit">Honing in on the data</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Our algorithm factors in yield rates, average GPA/GRE for international students, and the "Indian Student Quotient" for target programs.
                      </p>
                   </div>
                   <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-[10px] font-mono text-primary relative z-10 uppercase tracking-widest">
                      Powered by Gemini 1.5 Flash Heuristics
                   </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : isAnalyzing ? (
          <AILoadingState message="Simulating application committee review..." />
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-12 pb-20"
          >
            {/* Main Probability Section */}
            <div className="grid lg:grid-cols-12 gap-10 items-center">
               <div className="lg:col-span-5 text-center space-y-8">
                  {report && <ProbabilityGauge value={report.probability} />}
                  <div className={cn(
                    "inline-block px-10 py-3 rounded-2xl font-bold font-outfit text-xl border shadow-xl relative overflow-hidden group",
                    report?.zone === "reach" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                    report?.zone === "moderate" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    report?.zone === "good" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                    "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  )}>
                     <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                     {report?.zone.toUpperCase()} MATCH
                  </div>
                  <p className="text-sm text-muted-foreground italic max-w-sm mx-auto">
                    &quot;{report?.aiInsight}&quot;
                  </p>
               </div>

               <Card className="lg:col-span-7 bg-[#111827] border-white/10 p-8">
                  <h3 className="text-xl font-bold font-outfit flex items-center mb-8 border-b border-white/5 pb-4">
                     <Award className="w-5 h-5 mr-3 text-primary" /> Profile Breakdown Analysis
                  </h3>
                  <div className="h-[350px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={report?.radarData || []}>
                          <PolarGrid stroke="#ffffff10" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name="Your Profile"
                            dataKey="A"
                            stroke="#f59e0b"
                            fill="#f59e0b"
                            fillOpacity={0.5}
                          />
                        </RadarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
            </div>

            {/* Lifting Up / Dragging Down */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="bg-[#111827] border-white/10 p-8 group">
                  <div className="flex items-center space-x-3 mb-8 border-b border-white/5 pb-4 text-emerald-500">
                     <ShieldCheck className="w-6 h-6" />
                     <h4 className="font-bold font-outfit text-lg">Lifting You Up</h4>
                  </div>
                  <ul className="space-y-6">
                    {report?.liftingUp.map((text, i) => (
                      <li key={i} className="flex items-start space-x-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px] font-bold shrink-0 mt-0.5 border border-emerald-500/20">{i+1}</div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                      </li>
                    ))}
                  </ul>
               </Card>

               <Card className="bg-[#111827] border-white/10 p-8 group">
                  <div className="flex items-center space-x-3 mb-8 border-b border-white/5 pb-4 text-red-500">
                     <AlertTriangle className="w-6 h-6" />
                     <h4 className="font-bold font-outfit text-lg">Dragging You Down</h4>
                  </div>
                  <ul className="space-y-6">
                    {report?.draggingDown.map((text, i) => (
                      <li key={i} className="flex items-start space-x-4">
                        <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-[10px] font-bold shrink-0 mt-0.5 border border-red-500/20">{i+1}</div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                      </li>
                    ))}
                  </ul>
               </Card>
            </div>

            {/* Improvement Action List */}
            <Card className="bg-primary/5 border-primary/20 p-10">
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                  <div>
                    <h3 className="text-2xl font-bold font-outfit text-white mb-2">Priority Improvement Actions</h3>
                    <p className="text-sm text-muted-foreground">Strategic tasks that can significantly move your probability gauge.</p>
                  </div>
                  <div className="px-6 py-2 bg-primary/20 rounded-full border border-primary/30 flex items-center">
                     <Zap className="w-4 h-4 mr-3 text-primary" />
                     <span className="text-xs font-bold text-white font-mono">EST. BOOST: ~15-20%</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {report?.improvements.map((action, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ x: 10 }}
                      className="p-6 rounded-2xl bg-[#111827] border border-white/5 flex items-center justify-between group cursor-default"
                    >
                       <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background transition-colors">
                             <TrendingUp className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-bold text-muted-foreground group-hover:text-white transition-colors">{action.action}</span>
                       </div>
                       <div className="text-primary font-bold font-mono text-lg">{action.boost}</div>
                    </motion.div>
                  ))}
               </div>
            </Card>

            <div className="flex flex-col items-center space-y-6 pt-10">
               <div className="flex space-x-4">
                 <Button variant="outline" className="border-white/10 text-primary hover:bg-primary/5 h-12 px-8">
                    <Share2 className="w-4 h-4 mr-2" /> Share My Odds 🎯
                 </Button>
                 <Button 
                   onClick={() => setReport(null)}
                   variant="ghost" 
                   className="text-muted-foreground font-mono text-xs hover:text-white group h-12 px-8"
                 >
                   <Zap className="w-3 h-3 mr-3 group-hover:fill-primary" /> NEW ASSESSMENT
                 </Button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
