"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  ChevronRight,
  MapPin,
  TrendingUp,
  Zap,
  Loader2,
  DollarSign,
  Clock,
  Target,
  ArrowRight,
  Info,
  CheckCircle2,
  Trophy
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import AILoadingState from "@/components/shared/AILoadingState";
import { cn } from "@/lib/utils";
import { awardXP, saveToolHistory, syncProfileData } from "@/lib/gamification";
import { supabase } from "@/lib/supabase";
import { AddShortlistModal } from "@/components/shortlist/AddShortlistModal";
import { Plus } from "lucide-react";

const COUNTRIES = [
  { id: "usa", label: "USA", flag: "🇺🇸" },
  { id: "uk", label: "UK", flag: "🇬🇧" },
  { id: "canada", label: "Canada", flag: "🇨🇦" },
  { id: "germany", label: "Germany", flag: "🇩🇪" },
  { id: "australia", label: "Australia", flag: "🇦🇺" },
];

import { apiPost } from "@/lib/api-client";
import { useDemoMode } from "@/contexts/DemoContext";
import { useFormPersist } from "@/hooks/useFormPersist";
import { useUnsavedWarning } from "@/hooks/useUnsavedWarning";
import { useAILoadingMessages } from "@/hooks/useAILoadingMessages";

const INITIAL_PROFILE = {
  degree: "",
  field: "",
  gpa: 8.0,
  gradYear: "2024",
  gre: 310,
  greSkipped: false,
  ielts: 7.0,
  ieltsSkipped: false,
  countries: [] as string[],
  careerGoal: "",
  budget: 50000,
  workExp: "0",
};

interface University {
  name: string;
  program: string;
  country?: string;
  tuition?: string | number;
  ranking?: string;
  rankingScore?: number;
  fitScore?: number;
}

interface CountryRecommendation {
  country: string;
  fitScore: number;
  jobMarketScore: number;
  reasoning: string;
  topUniversities: University[];
  postStudyVisa: string;
}

interface ProgramRecommendation {
  program: string;
  fitScore: number;
  reasoning: string;
}

interface SalaryTrajectory {
  role: string;
  salaryUSD: string;
  salaryINR: string;
}

interface CareerTrajectory {
  year1: SalaryTrajectory;
  year3: SalaryTrajectory;
  year5: SalaryTrajectory;
}

interface CareerResults {
  countryRecommendations: CountryRecommendation[];
  programRecommendations: ProgramRecommendation[];
  careerTrajectory: CareerTrajectory;
  keyInsight: string;
}

export default function CareerNavigator() {
  const { isDemoMode, demoProfile } = useDemoMode();

  const [profile, setProfile, clearPersist, wasRestored] = useFormPersist("career_nav", INITIAL_PROFILE);
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<CareerResults | null>(null);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);

  // Unsaved Warning
  useUnsavedWarning(step > 1 && !results);

  // AI Loading Messages
  const loadingMessage = useAILoadingMessages("career", isAnalyzing);

  useEffect(() => {
    if (isDemoMode && !wasRestored) {
      setProfile({
        degree: demoProfile.degree,
        field: demoProfile.field,
        gpa: demoProfile.gpa,
        gre: demoProfile.gre,
        ielts: demoProfile.ielts,
        countries: demoProfile.targetCountries.map(c => c.toLowerCase()),
        careerGoal: demoProfile.careerGoal,
        budget: demoProfile.budget,
        workExp: demoProfile.workExp.toString()
      });
    }
  }, [isDemoMode, demoProfile, wasRestored, setProfile]);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const toggleCountry = (id: string) => {
    setProfile({
      countries: profile.countries.includes(id)
        ? profile.countries.filter(c => c !== id)
        : [...profile.countries, id]
    });
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);

    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 2000));
      setResults({
        countryRecommendations: [
          {
            country: "USA",
            fitScore: 88,
            jobMarketScore: 92,
            reasoning: "Your background in Java and Spring Boot aligns perfectly with the current demand for backend engineers in the Silicon Valley and New York tech hubs.",
            topUniversities: [
              { name: "University of California, San Diego", program: "MS Computer Science", ranking: "Top 20", rankingScore: 94 },
              { name: "New York University", program: "MS Computer Science", ranking: "Top 30", rankingScore: 88 }
            ],
            postStudyVisa: "3 Years (STEM OPT)"
          },
          {
            country: "Germany",
            fitScore: 75,
            jobMarketScore: 85,
            reasoning: "Germany offers excellent ROI with low tuition fees. Your technical skills are in high demand in Berlin's growing startup scene.",
            topUniversities: [
              { name: "TU Munich", program: "MS Informatics", ranking: "Elite", rankingScore: 96 },
              { name: "RWTH Aachen", program: "MS Software Systems", ranking: "Top 5", rankingScore: 92 }
            ],
            postStudyVisa: "18 Months Job Seeking Visa"
          },
          {
            country: "Canada",
            fitScore: 82,
            jobMarketScore: 78,
            reasoning: "Canada has a very favorable immigration policy for STEM graduates. Toronto and Vancouver are seeing significant cloud-computing growth.",
            topUniversities: [
              { name: "University of Toronto", program: "MS Computer Science", ranking: "Global Top 10", rankingScore: 98 },
              { name: "University of Waterloo", program: "M.Eng. Software", ranking: "STEM Leader", rankingScore: 95 }
            ],
            postStudyVisa: "Up to 3 Years PGWP"
          }
        ],
        programRecommendations: [
          { program: "MS in Computer Science", fitScore: 98, reasoning: "Direct continuation of your B.Tech with high specialization potential in AI/ML." },
          { program: "MS in Software Engineering", fitScore: 92, reasoning: "Focuses on the engineering lifecycle, matching your backend development experience." },
          { program: "Masters in Data Science", fitScore: 84, reasoning: "Good pivot if you want to transition towards data-centric roles." }
        ],
        careerTrajectory: {
          year1: { role: "Junior Software Engineer", salaryUSD: "$110,000", salaryINR: "₹91L approx" },
          year3: { role: "Software Engineer II / Senior", salaryUSD: "$145,000", salaryINR: "₹1.2Cr approx" },
          year5: { role: "Staff Engineer / AI Lead", salaryUSD: "$185,000", salaryINR: "₹1.5Cr approx" }
        },
        keyInsight: "Arjun, your internship at Infosys is a significant asset. You should target 'Reach' schools in the US like UCSD and NYU, as your technical depth compensates for the slightly lower GRE. Focus your SOP on the 40% latency reduction achievement."
      });
      setIsAnalyzing(false);
      return;
    }

    try {
      const data = await apiPost<CareerResults>('/api/gemini/career', profile);
      setResults(data);
      if (!isDemoMode) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await awardXP(user.id, 'CAREER_NAVIGATOR');
          // Sync profile data back to user_profiles
          await syncProfileData(user.id, {
            gpa: profile.gpa,
            gre: profile.greSkipped ? undefined : profile.gre,
            ielts: profile.ieltsSkipped ? undefined : profile.ielts,
            budget: profile.budget,
            degree: profile.degree,
            field: profile.field,
            targetCountries: profile.countries
          });
          // Save result to history
          await saveToolHistory(user.id, 'career_navigator', profile, data as unknown as Record<string, unknown>);
        }
      }
      toast.success("🎯 +50 XP — Career Path Unlocked!", {
        description: "Your AI analysis is ready for review. Profile data updated.",
      });
    } catch (error: unknown) {
      toast.error("Analysis failed", {
        description: error instanceof Error ? error.message : "There was an error consulting the AI. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold font-outfit text-white tracking-tight">AI Career Navigator</h1>
        <p className="text-muted-foreground font-mono text-sm max-w-2xl">
          Multi-agent analysis of university trends, salary projections, and ROI metrics tailored to your profile.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {!results && !isAnalyzing ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid lg:grid-cols-12 gap-8"
          >
            {/* Form Side */}
            <Card className="lg:col-span-8 bg-[#111827] border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ width: `${(step / 3) * 100}%` }}
                />
              </div>

              <CardContent className="p-8">
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                      <h2 className="text-2xl font-bold font-outfit">Academic Background</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Current Degree</Label>
                        <Select onValueChange={(v: string | null) => v && setProfile({ degree: v })}>
                          <SelectTrigger className="bg-white/5 border-white/10 h-12">
                            <SelectValue placeholder="Select Degree" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111827] border-white/10">
                            <SelectItem value="B.Tech/B.E.">B.Tech/B.E.</SelectItem>
                            <SelectItem value="BCA">BCA</SelectItem>
                            <SelectItem value="BBA">BBA</SelectItem>
                            <SelectItem value="B.Sc.">B.Sc.</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Field of Study</Label>
                        <Input
                          placeholder="e.g. Computer Science"
                          className="bg-white/5 border-white/10 h-12"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ field: e.target.value })}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">GPA / Percentage</Label>
                          <span className="text-primary font-bold">{profile.gpa}</span>
                        </div>
                        <Slider
                          defaultValue={[8.0]}
                          max={100}
                          step={0.1}
                          onValueChange={(v: number | readonly number[]) => setProfile({ gpa: Array.isArray(v) ? v[0] : v })}
                          className="py-4"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Graduation Year</Label>
                        <Select onValueChange={(v: string | null) => v && setProfile({ gradYear: v })}>
                          <SelectTrigger className="bg-white/5 border-white/10 h-12">
                            <SelectValue placeholder="2024" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111827] border-white/10">
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                      <h2 className="text-2xl font-bold font-outfit">Test Scores</h2>
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm font-bold">GRE Score</Label>
                            {profile.greSkipped && <Badge variant="secondary" className="bg-white/10">Skipped</Badge>}
                          </div>
                          {!profile.greSkipped && <span className="font-mono text-primary font-bold">{profile.gre}</span>}
                        </div>
                        <Slider
                          disabled={profile.greSkipped}
                          defaultValue={[310]}
                          min={260}
                          max={340}
                          onValueChange={(v: number | readonly number[]) => setProfile({ gre: Array.isArray(v) ? v[0] : v })}
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="greSkipped"
                            onCheckedChange={(c: boolean) => setProfile({ greSkipped: !!c })}
                          />
                          <Label htmlFor="greSkipped" className="text-xs text-muted-foreground cursor-pointer">I haven't taken the GRE yet</Label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm font-bold">IELTS Score</Label>
                            {profile.ieltsSkipped && <Badge variant="secondary" className="bg-white/10">Skipped</Badge>}
                          </div>
                          {!profile.ieltsSkipped && <span className="font-mono text-primary font-bold">{profile.ielts}</span>}
                        </div>
                        <Slider
                          disabled={profile.ieltsSkipped}
                          defaultValue={[7.0]}
                          min={5.0}
                          max={9.0}
                          step={0.5}
                          onValueChange={(v: number | readonly number[]) => setProfile({ ielts: Array.isArray(v) ? v[0] : v })}
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="ieltsSkipped"
                            onCheckedChange={(c: boolean) => setProfile({ ieltsSkipped: !!c })}
                          />
                          <Label htmlFor="ieltsSkipped" className="text-xs text-muted-foreground cursor-pointer">I haven't taken the IELTS yet</Label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center space-x-3 mb-8">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                      <h2 className="text-2xl font-bold font-outfit">Preferences & Goals</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Target Destinations</Label>
                        <div className="flex flex-wrap gap-2">
                          {COUNTRIES.map(c => (
                            <button
                              key={c.id}
                              onClick={() => toggleCountry(c.id)}
                              className={cn(
                                "flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all",
                                profile.countries.includes(c.id)
                                  ? "bg-primary text-background border-primary shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)] font-bold"
                                  : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                              )}
                            >
                              <span>{c.flag}</span>
                              <span className="text-sm">{c.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Career Goal (Max 200 chars)</Label>
                        <Textarea
                          placeholder="e.g. I want to become a Machine Learning Engineer at a Tier-1 tech company in the US."
                          className="bg-white/5 border-white/10 min-h-[100px]"
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProfile({ careerGoal: e.target.value })}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Budget (Annual)</Label>
                            <span className="text-primary font-bold">${profile.budget.toLocaleString()}</span>
                          </div>
                          <Slider
                            defaultValue={[50000]}
                            min={20000}
                            max={150000}
                            step={1000}
                            onValueChange={(v: number | readonly number[]) => setProfile({ budget: Array.isArray(v) ? v[0] : v })}
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Work Experience</Label>
                          <Select onValueChange={(v: string | null) => v && setProfile({ workExp: v })}>
                            <SelectTrigger className="bg-white/5 border-white/10 h-12">
                              <SelectValue placeholder="0 Yrs" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111827] border-white/10">
                              <SelectItem value="0">0 Years</SelectItem>
                              <SelectItem value="1">1 Year</SelectItem>
                              <SelectItem value="2">2 Years</SelectItem>
                              <SelectItem value="3">3 Years</SelectItem>
                              <SelectItem value="4">4+ Years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-between mt-12 pt-8 border-t border-white/5">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={step === 1}
                    className="text-muted-foreground hover:text-white"
                  >
                    Back
                  </Button>

                  {step < 3 ? (
                    <Button onClick={nextStep} className="bg-primary text-background font-bold px-8">
                      Continue <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStartAnalysis}
                      className="bg-primary text-background font-bold px-8 shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)]"
                    >
                      Analyze Profile <Zap className="ml-2 w-4 h-4 fill-background" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Info Side */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="bg-primary/5 border-primary/20 p-6">
                <h3 className="font-bold flex items-center text-primary mb-4">
                  <Zap className="w-5 h-5 mr-2 fill-primary" /> Multi-Agent AI System
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our Career Navigator uses dynamic agentic workflows to cross-reference your academic data with historical admission trends and current post-grad salary data from 2,000+ institutions globally.
                </p>
              </Card>

              <div className="space-y-4">
                {[
                  { icon: Target, text: "Curated list of 'Reach' and 'Safe' schools" },
                  { icon: DollarSign, text: "Post-study salary and ROI projections" },
                  { icon: CheckCircle2, text: "Visa eligibility check based on course type" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 rounded-lg bg-white/5 border border-white/5">
                    <item.icon className="w-5 h-5 text-primary mt-0.5" />
                    <span className="text-xs text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : isAnalyzing ? (
          <AILoadingState message={loadingMessage} />
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-12"
          >
            {/* Country Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {results?.countryRecommendations.map((rec, i) => (
                <Card key={i} className="bg-[#111827] border-white/10 hover:border-primary/50 transition-all group overflow-hidden">
                  <CardHeader className="p-6 pb-0 relative">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{COUNTRIES.find(c => c.label === rec.country)?.flag || "🌍"}</span>
                        <div>
                          <h3 className="text-2xl font-bold font-outfit">{rec.country}</h3>
                          <div className="flex items-center space-x-2 text-[10px] uppercase font-mono text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" /> Job Market: {rec.jobMarketScore}/100
                          </div>
                        </div>
                      </div>
                      <div className="relative w-16 h-16">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="32" cy="32" r="28"
                            stroke="currentColor" strokeWidth="4"
                            fill="transparent" className="text-white/5"
                          />
                          <circle
                            cx="32" cy="32" r="28"
                            stroke="currentColor" strokeWidth="4"
                            fill="transparent" strokeDasharray={176}
                            strokeDashoffset={176 - (176 * rec.fitScore) / 100}
                            className="text-primary"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold">{rec.fitScore}%</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      "{rec.reasoning}"
                    </p>
                    <div className="space-y-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-white/5 pb-2">Top Universities</p>
                      {rec.topUniversities.map((uni, j) => (
                        <div key={j} className="flex justify-between items-center group/item hover:bg-white/5 p-2 rounded transition-colors">
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-bold">{uni.name}</span>
                            <span className="text-[10px] text-muted-foreground">{uni.program}</span>
                            <button
                              onClick={() => setSelectedUni({ ...uni, country: rec.country })}
                              className="text-[9px] font-mono text-primary mt-2 flex items-center hover:underline opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                              <Plus className="w-3 h-3 mr-1" /> ADD TO SHORTLIST
                            </button>
                          </div>
                          <Badge className="bg-white/10 text-primary font-mono text-[9px]">{uni.ranking}</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Visa Impact</p>
                      <p className="text-xs text-white bg-primary/5 p-2 rounded border border-primary/20">{rec.postStudyVisa}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Program Recommendations */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <h3 className="text-2xl font-bold font-outfit flex items-center">
                  <Zap className="w-6 h-6 mr-3 text-primary" /> Specialized Program Tracks
                </h3>
                <div className="space-y-4">
                  {results?.programRecommendations.map((prog, i) => (
                    <Card key={i} className="bg-[#111827] border-white/10 p-6 flex items-center justify-between group hover:bg-primary/[0.02] transition-colors">
                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{prog.program}</h4>
                        <p className="text-sm text-muted-foreground max-w-2xl">{prog.reasoning}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center w-24 h-24 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-2xl font-bold font-space-mono text-white">{prog.fitScore}%</span>
                        <span className="text-[8px] font-mono text-muted-foreground uppercase">AI Fit</span>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Career Trajectory Timeline */}
                <div className="pt-12 space-y-8">
                  <h3 className="text-2xl font-bold font-outfit flex items-center">
                    <TrendingUp className="w-6 h-6 mr-3 text-primary" /> 5-Year Salary Trajectory
                  </h3>
                  <div className="relative pt-12 pb-6 px-4">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2" />
                    <div className="grid grid-cols-3 gap-4 relative z-10">
                      {[
                        { label: "Year 1", ...results?.careerTrajectory.year1 },
                        { label: "Year 3", ...results?.careerTrajectory.year3 },
                        { label: "Year 5", ...results?.careerTrajectory.year5 },
                      ].map((point, i) => (
                        <div key={i} className="flex flex-col items-center text-center space-y-4">
                          <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                          <div className="bg-[#111827] border border-white/10 p-4 rounded-xl space-y-2 w-full">
                            <p className="text-xs font-mono text-primary font-bold uppercase">{point.label}</p>
                            <p className="text-sm font-bold text-white h-10 flex items-center justify-center leading-tight">{point.role}</p>
                            <div className="pt-2 border-t border-white/5 space-y-1">
                              <p className="text-xs font-mono text-white">{point.salaryUSD}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{point.salaryINR}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insight Bar */}
              <div className="lg:col-span-4 space-y-6 sticky top-24">
                <Card className="bg-primary/5 border border-primary/20 p-8 relative overflow-hidden">
                  <Loader2 className="absolute top-4 right-4 text-primary/10 w-24 h-24 animate-[spin_20s_linear_infinite]" />
                  <h3 className="text-xl font-bold text-primary mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 fill-primary" /> AI Matchmaker Insight
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                    {results?.keyInsight}
                  </p>
                  <div className="mt-8 pt-8 border-t border-primary/10 flex justify-between items-center relative z-10">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">Profile Level Suggestion</p>
                    <Badge className="bg-primary text-background font-bold">LVL 3 PROTECTOR</Badge>
                  </div>
                </Card>

                <Button
                  variant="outline"
                  onClick={() => setResults(null)}
                  className="w-full border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                >
                  Start New Analysis
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedUni && (
        <AddShortlistModal
          isOpen={!!selectedUni}
          onClose={() => setSelectedUni(null)}
          university={selectedUni as any}
        />
      )}
    </div>
  );
}
