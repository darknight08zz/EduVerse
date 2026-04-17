"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  TrendingUp, 
  CheckCircle2, 
  Info, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  PieChart as PieIcon,
  Table as TableIcon,
  FileText,
  AlertTriangle,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  Banknote,
  Sparkles
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import AILoadingState from "@/components/shared/AILoadingState";
import { apiPost } from "@/lib/api-client";
import { matchLoans, type LoanProduct } from "@/lib/loan-engine";
import { cn } from "@/lib/utils";
import { awardXP } from "@/lib/gamification";
import { supabase } from "@/lib/supabase";
import { useDemoMode } from "@/contexts/DemoContext";
import { useFormPersist } from "@/hooks/useFormPersist";
import { useUnsavedWarning } from "@/hooks/useUnsavedWarning";
import { useAILoadingMessages } from "@/hooks/useAILoadingMessages";
import { ExternalLinkDialog } from "@/components/shared/ExternalLinkDialog";

const EX_RATE = 83.5;

const INITIAL_ASSESSMENT = {
  university: "",
  program: "",
  totalCostUSD: 60000,
  ownFundsINR: 1000000,
  hasCoSigner: true,
  hasCollateral: false,
  universityRanking: "other" as "premier" | "top100" | "other",
  targetCountry: "USA",
  expectedSalaryUSD: 95000
};

interface ChecklistCategory {
  name: string;
  documents: string[];
}

interface LoanChecklist {
  categories: ChecklistCategory[];
}

export default function LoanEstimator() {
  const { isDemoMode, demoProfile } = useDemoMode();
  
  const [assessment, setAssessment, clearPersist, wasRestored] = useFormPersist("loan_assessment", INITIAL_ASSESSMENT);
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  
  // Step 2 & 3: Loan Selection & EMI
  const [selectedLoan, setSelectedLoan] = useState<LoanProduct | null>(null);
  const [tenure, setTenure] = useState(10);
  const [customRate, setCustomRate] = useState(10.5);

  // Step 4: Checklist
  const [checklist, setChecklist] = useState<LoanChecklist | null>(null);
  const [completedDocs, setCompletedDocs] = useState<string[]>([]);

  // Unsaved Warning
  useUnsavedWarning(step > 1 && step < 4 && !checklist);

  // AI Loading Messages
  const loadingMessage = useAILoadingMessages("loan", isGenerating);

  // Auto-fill from demo/localStorage
  useEffect(() => {
    if (isDemoMode && !wasRestored) {
      setAssessment({
        university: "University of California, San Diego",
        program: "MS Computer Science",
        totalCostUSD: 55000,
        ownFundsINR: 1500000,
        universityRanking: "top100",
        expectedSalaryUSD: 110000
      });
      return;
    }

    const savedROI = localStorage.getItem('eduverse_roi_inputs');
    if (savedROI && !wasRestored) {
      const data = JSON.parse(savedROI);
      setAssessment({
        university: data.programName || "",
        totalCostUSD: data.tuition || 60000,
        expectedSalaryUSD: data.expectedSalaryUSD || 95000,
        targetCountry: data.targetCountry || "USA"
      });
    }
  }, [isDemoMode]);

  // Derived Values
  const loanNeededUSD = Math.max(0, assessment.totalCostUSD - (assessment.ownFundsINR / EX_RATE));
  const loanNeededINR = loanNeededUSD * EX_RATE;

  const matchedLoans = useMemo(() => {
    return matchLoans({
      loanAmountINR: loanNeededINR,
      hasCoSigner: assessment.hasCoSigner,
      hasCollateral: assessment.hasCollateral,
      universityRanking: assessment.universityRanking,
      targetCountry: assessment.targetCountry
    });
  }, [assessment, loanNeededINR]);

  const emiData = useMemo(() => {
    const principal = loanNeededINR;
    const rate = (selectedLoan ? (parseFloat(selectedLoan.interestRate) || customRate) : customRate) / 100 / 12;
    const months = tenure * 12;
    
    if (principal <= 0) return { emi: 0, totalInterest: 0, totalPayable: 0, chart: [] };

    const emi = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    const totalPayable = emi * months;
    const totalInterest = totalPayable - principal;

    const chart = [];
    for (let i = 1; i <= tenure; i++) {
        chart.push({
            year: `Year ${i}`,
            principal: principal / tenure,
            interest: totalInterest / tenure
        });
    }

    const emiPercentOfSalary = (emi * 12) / (assessment.expectedSalaryUSD * EX_RATE) * 100;

    return { emi, totalInterest, totalPayable, chart, emiPercentOfSalary };
  }, [loanNeededINR, selectedLoan, customRate, tenure, assessment.expectedSalaryUSD]);

  const handleStartAssessment = async () => {
    setStep(2);
    if (!isDemoMode) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await awardXP(user.id, 'LOAN_ESTIMATOR_ASSESSMENT');
    }
    toast.success("🏦 +60 XP — Financial Planner Pro!", {
        description: "Your personalized loan matching report is generated.",
    });
  };

  const handleGenerateChecklist = async () => {
    if (!selectedLoan) return;
    setIsGenerating(true);

    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 1500));
      setChecklist({
        categories: [
          { name: "Academic Documents", documents: ["Class 10th & 12th Marksheets", "B.Tech Final Degree Certificate", "GRE Scorecard Official", "IELTS (7.5) Scorecard"] },
          { name: "Financial (Co-Borrower)", documents: ["Form 16 (Last 2 years)", "ITR (Last 3 years)", "Salary Slips (6 months)", "Infosys Employment ID"] },
          { name: "KYC & Identity", documents: ["Valid Passport", "PAN Card", "Aadhar Card"] }
        ]
      });
      setStep(4);
      setIsGenerating(false);
      return;
    }

    try {
      const data = await apiPost<LoanChecklist>('/api/gemini/loan-checklist', {
        loanProduct: selectedLoan.productName,
        program: assessment.program,
        university: assessment.university,
        country: assessment.targetCountry,
        hasCoSigner: assessment.hasCoSigner
      });
      setChecklist(data);
      setStep(4);
      toast.info("🎯 +20 XP — Loan Comparison Saved");
    } catch (err: unknown) {
      toast.error("Checklist Error", {
        description: err instanceof Error ? err.message : "Failed to generate checklist"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleDoc = (doc: string) => {
    setCompletedDocs(p => {
        const next = p.includes(doc) ? p.filter(d => d !== doc) : [...p, doc];
        if (next.length > 5 && p.length <= 5) {
             toast.success("📄 +50 XP — Application Ready!", {
                description: "You've gathered most of the required documents."
             });
        }
        return next;
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3 mb-2">
           {[1, 2, 3, 4].map(s => (
             <div key={s} className={cn(
               "h-1.5 w-12 rounded-full transition-all duration-500",
               step >= s ? "bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-white/5"
             )} />
           ))}
        </div>
        <h1 className="text-4xl font-bold font-outfit text-white tracking-tight">Loan Approval Estimator</h1>
        <p className="text-muted-foreground font-mono text-sm max-w-2xl">
          Matching your profile against SBI, HDFC Credila, and top global fintech lenders.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="bg-[#111827] border-white/10 p-8 shadow-2xl">
               <div className="grid lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                      <h3 className="text-xl font-bold font-outfit flex items-center">
                        <Calculator className="w-5 h-5 mr-3 text-primary" /> Loan Need Assessment
                      </h3>

                      {wasRestored && step === 1 && (
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-primary">Financial plan restored from previous session.</span>
                          </div>
                          <button 
                            onClick={clearPersist}
                            className="text-[10px] font-mono text-muted-foreground hover:text-white transition-colors"
                          >
                            RESET
                          </button>
                        </div>
                      )}
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <Label className="text-xs font-mono uppercase text-muted-foreground">Target University / Program</Label>
                            <Input 
                             value={assessment.university}
                             onChange={(e) => setAssessment({ university: e.target.value })}
                             className="bg-white/5 border-white/10 h-12"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <Label className="text-xs font-mono uppercase text-muted-foreground">Total Cost (USD)</Label>
                              <Input 
                                type="number"
                                value={assessment.totalCostUSD}
                                onChange={(e) => setAssessment({ totalCostUSD: parseInt(e.target.value) || 0 })}
                                className="bg-white/5 border-white/10"
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-xs font-mono uppercase text-muted-foreground">Own Funds (INR)</Label>
                              <Input 
                                type="number"
                                value={assessment.ownFundsINR}
                                onChange={(e) => setAssessment({ ownFundsINR: parseInt(e.target.value) || 0 })}
                                className="bg-white/5 border-white/10"
                              />
                           </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                           <div>
                              <p className="text-[10px] font-mono text-muted-foreground uppercase opacity-60">Estimated Loan Gap</p>
                              <p className="text-3xl font-bold text-white font-space-mono">₹{Math.round(loanNeededINR / 100000)}L</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-mono text-muted-foreground uppercase opacity-60">In USD</p>
                              <p className="text-lg font-bold text-primary">${Math.round(loanNeededUSD).toLocaleString()}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-8 bg-white/[0.02] p-8 rounded-2xl border border-white/5">
                     <h3 className="text-xl font-bold font-outfit flex items-center">
                        <ShieldCheck className="w-5 h-5 mr-3 text-emerald-500" /> Eligibility Profile
                     </h3>
                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="space-y-1">
                              <Label className="text-sm font-bold">Indian Co-signer Available?</Label>
                              <p className="text-xs text-muted-foreground">Usually parents or relatives with income.</p>
                           </div>
                           <Switch 
                            checked={assessment.hasCoSigner}                             onCheckedChange={(c: boolean) => setAssessment({ hasCoSigner: c })} 
                           />
                        </div>
                        <div className="flex items-center justify-between border-t border-white/5 pt-6">
                           <div className="space-y-1">
                              <Label className="text-sm font-bold">Have Collateral?</Label>
                              <p className="text-xs text-muted-foreground">Property or FD for lower interest rates.</p>
                           </div>
                           <Switch 
                            checked={assessment.hasCollateral}                             onCheckedChange={(c: boolean) => setAssessment({ hasCollateral: c })} 
                           />
                        </div>
                        <div className="space-y-4 pt-6 border-t border-white/5">
                           <Label className="text-xs font-mono uppercase text-muted-foreground">University Tier</Label>
                           <Select 
                            value={assessment.universityRanking}                             onValueChange={(v: string | null) => v && setAssessment({ universityRanking: v as "premier" | "top100" | "other" })}
                           >
                              <SelectTrigger className="bg-white/5 border-white/10">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#111827] border-white/10">
                                 <SelectItem value="premier">Premier (IITs/IIMs/Top 50 QS)</SelectItem>
                                 <SelectItem value="top100">Top 100 Global Rank</SelectItem>
                                 <SelectItem value="other">Other Reputed Universities</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                        <Button onClick={handleStartAssessment} className="w-full h-14 bg-primary text-background font-bold text-lg shadow-xl shadow-primary/20">
                           Analyze Loan Options <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                     </div>
                  </div>
               </div>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {matchedLoans.map((loan, idx) => (
                 <Card 
                  key={idx} 
                  className={cn(
                    "bg-[#111827] border-white/10 flex flex-col hover:border-primary/50 transition-all cursor-pointer group relative overflow-hidden",
                    selectedLoan?.lender === loan.lender && "border-primary ring-1 ring-primary"
                  )}
                  onClick={() => {
                        setSelectedLoan(loan);
                        setCustomRate(parseFloat(loan.interestRate) || 10.5);
                  }}
                 >
                    {loan.recommendation === 'Best Match' && (
                        <div className="absolute top-0 right-0 p-3 bg-primary text-background font-black text-[10px] uppercase tracking-tighter -rotate-1 shadow-xl">
                            BEST MATCH
                        </div>
                    )}
                    <CardHeader className="pb-4">
                       <div className="flex justify-between items-start">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl bg-white/5",
                            loan.lender === 'SBI' ? "text-blue-500" : loan.lender === 'MPOWER' ? "text-emerald-500" : "text-primary"
                          )}>
                             {loan.lender[0]}
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-mono text-muted-foreground uppercase">Fit Score</p>
                             <p className="text-xl font-bold text-primary">{loan.fitScore}%</p>
                          </div>
                       </div>
                       <CardTitle className="text-base mt-4">{loan.productName}</CardTitle>
                       <p className="text-[10px] text-muted-foreground font-mono">{loan.lender}</p>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                       <div className="grid grid-cols-2 gap-4 text-[11px] font-mono border-y border-white/5 py-4">
                          <div className="space-y-1">
                             <p className="opacity-50 text-[9px]">INTEREST RATE</p>
                             <p className="text-white font-bold">{loan.interestRate}</p>
                          </div>
                          <div className="space-y-1 text-right">
                             <p className="opacity-50 text-[9px]">MAX AMOUNT</p>
                             <p className="text-white font-bold">{loan.maxAmount.split('(')[0]}</p>
                          </div>
                          <div className="space-y-1 mt-2">
                             <p className="opacity-50 text-[9px]">FEE</p>
                             <p className="text-white font-bold">{loan.processingFee}</p>
                          </div>
                          <div className="space-y-1 text-right mt-2">
                             <p className="opacity-50 text-[9px]">TENURE</p>
                             <p className="text-white font-bold">{loan.repaymentPeriod}</p>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div className="space-y-2">
                             <p className="text-[9px] font-mono text-emerald-500 uppercase font-bold tracking-widest">PROS</p>
                             <div className="flex flex-wrap gap-2">
                                {loan.pros.map(p => (
                                    <span key={p} className="text-[8px] bg-emerald-500/5 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">{p}</span>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-2">
                             <p className="text-[9px] font-mono text-primary uppercase font-bold tracking-widest">CONS</p>
                             <div className="flex flex-wrap gap-2 opacity-60">
                                {loan.cons.map(c => (
                                    <span key={c} className="text-[8px] bg-primary/5 text-primary px-2 py-0.5 rounded border border-primary/20">{c}</span>
                                ))}
                             </div>
                          </div>
                       </div>
                    </CardContent>
                    <div className="p-4 border-t border-white/5 flex items-center justify-between transition-colors group-hover:bg-primary/5">
                        <span className="text-[10px] text-muted-foreground underline">View Details</span>
                        <ChevronRight className="w-4 h-4 text-primary" />
                    </div>
                 </Card>
               ))}
            </div>

            {selectedLoan && (
                <Card className="bg-primary/5 border border-primary/20 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                   <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                         <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                            <Banknote className="w-6 h-6 text-background" />
                         </div>
                         <div>
                            <h4 className="text-xl font-bold font-outfit">Ready to proceed with {selectedLoan.lender}?</h4>
                            <p className="text-sm text-muted-foreground">Select this product to calibrate your EMI and generate your document checklist.</p>
                         </div>
                      </div>
                   </div>
                   <div className="flex space-x-4">
                      <Button variant="outline" className="border-white/10" onClick={() => setSelectedLoan(null)}>Change Choice</Button>
                      <Button onClick={() => setStep(3)} className="bg-primary text-background font-bold h-12 px-8">Confirm & Calculate</Button>
                   </div>
                </Card>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
             <div className="grid lg:grid-cols-12 gap-10">
                <Card className="lg:col-span-12 bg-[#111827] border-white/10 p-8 shadow-2xl">
                   <div className="flex flex-col lg:flex-row gap-12">
                      <div className="lg:w-1/3 space-y-10 border-r border-white/5 pr-8">
                         <h3 className="text-xl font-bold font-outfit">EMI Calibration</h3>
                         
                         <div className="space-y-6">
                            <div className="flex justify-between items-center text-xs font-mono">
                               <span className="text-muted-foreground">LOAN AMOUNT (INR)</span>
                               <span className="text-white font-bold">₹{Math.round(loanNeededINR / 100000)}L</span>
                            </div>
                            <Slider disabled value={[loanNeededINR]} min={0} max={15000000} step={100000} />
                         </div>

                         <div className="space-y-6">
                            <div className="flex justify-between items-center text-xs font-mono">
                               <span className="text-muted-foreground">ANNUAL INTEREST RATE</span>
                               <span className="text-primary font-bold font-space-mono">{customRate.toFixed(2)}%</span>
                            </div>
                             <Slider 
                                value={[customRate]} min={7} max={18} step={0.05} 
                                onValueChange={(v) => setCustomRate(v[0])}
                            />
                         </div>

                         <div className="space-y-4">
                            <Label className="text-xs font-mono uppercase text-muted-foreground">REPAYMENT TENURE</Label>
                             <Select value={tenure.toString()} onValueChange={(v: string | null) => v && setTenure(parseInt(v))}>
                               <SelectTrigger className="bg-white/5 border-white/10">
                                  <SelectValue />
                               </SelectTrigger>
                               <SelectContent className="bg-[#111827] border-white/10">
                                  {[5, 7, 10, 12, 15].map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y} Years</SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                         </div>
                      </div>

                      <div className="flex-1 grid md:grid-cols-2 gap-12">
                         <div className="space-y-10">
                            <div className="space-y-2">
                               <p className="text-xs font-mono uppercase text-muted-foreground">Estimated Monthly EMI</p>
                               <div className="text-5xl font-black text-primary font-outfit">₹{Math.round(emiData.emi).toLocaleString()}</div>
                               <div className={cn(
                                 "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono font-bold mt-2",
                                 (emiData.emiPercentOfSalary || 0) < 30 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                 (emiData.emiPercentOfSalary || 0) < 50 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                 "bg-red-500/10 text-red-500 border border-red-500/20"
                               )}>
                                  {Math.round(emiData.emiPercentOfSalary || 0)}% OF EXPECTED SALARY
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                               <div className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground uppercase">Total Interest</p>
                                  <p className="text-xl font-bold font-space-mono text-white">₹{Math.round(emiData.totalInterest / 100000)}L</p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[10px] text-muted-foreground uppercase">Total Payable</p>
                                  <p className="text-xl font-bold font-space-mono text-white">₹{Math.round(emiData.totalPayable / 100000)}L</p>
                               </div>
                            </div>
                         </div>

                         <div className="h-[250px]">
                            <p className="text-[10px] font-mono text-muted-foreground uppercase mb-4">Interest vs Principal Trend</p>
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={emiData.chart}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                  <XAxis dataKey="year" fontSize={9} axisLine={false} tickLine={false} />
                                  <YAxis fontSize={9} axisLine={false} tickLine={false} hide />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                  />
                                  <Bar dataKey="principal" stackId="a" fill="#ffffff" fillOpacity={0.05} />
                                  <Bar dataKey="interest" stackId="a" fill="#f59e0b" />
                               </BarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                   </div>
                </Card>
             </div>

             <div className="flex justify-between items-center bg-[#111827] border border-white/10 p-8 rounded-2xl shadow-2xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20">
                     <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Next Step: AI Documentation Roadmap</h4>
                    <p className="text-sm text-muted-foreground">Gemini will analyze your profile to generate a lender-specific document checklist.</p>
                  </div>
                </div>
                <Button 
                    onClick={handleGenerateChecklist} 
                    disabled={isGenerating}
                    className="h-14 px-10 bg-white text-background font-black hover:bg-white/90"
                >
                  {isGenerating ? "Analyzing..." : "Generate Personalized Checklist"}
                </Button>
             </div>
          </motion.div>
        )}

        {isGenerating && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AILoadingState message={loadingMessage} />
          </motion.div>
        )}

        {step === 4 && checklist && (
           <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="grid lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-6">
                    {checklist.categories.map((cat, i) => (
                       <Card key={i} className="bg-[#111827] border-white/10 p-6">
                          <h3 className="text-sm font-bold font-mono text-primary flex items-center mb-6 uppercase tracking-widest">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3" /> {cat.name}
                          </h3>
                          <div className="space-y-4">
                             {cat.documents.map((doc: string) => (
                                <div 
                                    key={doc} 
                                    onClick={() => toggleDoc(doc)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                                        completedDocs.includes(doc) 
                                            ? "bg-emerald-500/5 border-emerald-500/30" 
                                            : "bg-white/[0.02] border-white/5 hover:border-white/20"
                                    )}
                                >
                                   <div className="flex items-center space-x-4">
                                      <div className={cn(
                                        "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                                        completedDocs.includes(doc) ? "bg-emerald-500 border-emerald-500" : "border-white/10"
                                      )}>
                                         {completedDocs.includes(doc) && <CheckCircle2 className="w-4 h-4 text-white" />}
                                      </div>
                                      <span className={cn("text-sm transition-opacity", completedDocs.includes(doc) ? "text-white opacity-100" : "text-muted-foreground")}>{doc}</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </Card>
                    ))}
                 </div>

                 <div className="space-y-6">
                    <Card className="bg-[#111827] border-white/10 p-6 sticky top-24">
                       <h4 className="text-xl font-bold font-outfit mb-6">Application Progress</h4>
                       <div className="space-y-6">
                          <div className="space-y-2">
                             <div className="flex justify-between text-xs font-mono mb-1">
                                <span className="text-muted-foreground">DOCUMENTS GATHERED</span>
                                <span className="text-primary">{Math.round((completedDocs.length / checklist.categories.reduce((acc, c) => acc + c.documents.length, 0)) * 100)}%</span>
                             </div>
                             <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }} 
                                    animate={{ width: `${(completedDocs.length / checklist.categories.reduce((acc, c) => acc + c.documents.length, 0)) * 100}%` }} 
                                    className="h-full bg-primary" 
                                />
                             </div>
                          </div>
                          
                          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
                             <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
                                Use this checklist to organize your physical documents. Most lenders like SBI require at least 2 sets of attested copies.
                             </p>
                              <Button 
                                onClick={() => setIsLinkDialogOpen(true)}
                                className="w-full bg-white/5 border-white/10 hover:bg-white/10 h-11 text-xs"
                              >
                                 <ExternalLink className="w-3 h-3 mr-2" /> Official {selectedLoan?.lender} Portal
                              </Button>
                           </div>

                          <div className="pt-6 border-t border-white/5 text-center">
                             <Button variant="ghost" onClick={() => setStep(1)} className="text-[10px] font-mono text-muted-foreground hover:text-white">
                                RE-CALCULATE ALL
                             </Button>
                          </div>
                       </div>
                    </Card>
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <ExternalLinkDialog 
        isOpen={isLinkDialogOpen}
        onClose={() => setIsLinkDialogOpen(false)}
        url="https://www.sbi.co.in/web/student-platform/education-loans"
        entityName={selectedLoan?.lender || "Lender"}
      />
    </div>
  );
}
