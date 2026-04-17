"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  DollarSign, 
  Calculator,
  Calendar,
  ArrowRight,
  Info,
  Zap,
  Shield,
  AlertCircle,
  Table as TableIcon,
  LineChart as LineChartIcon,
  Trophy,
  Share2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { awardXP, saveToolHistory, syncProfileData } from "@/lib/gamification";
import { supabase } from "@/lib/supabase";

import { apiPost } from "@/lib/api-client";
import { useDemoMode } from "@/contexts/DemoContext";

export default function ROICalculator() {
  const { isDemoMode, demoProfile } = useDemoMode();
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Input State
  const [inputs, setInputs] = useState({
    programName: "",
    tuition: 60000,
    livingExpenses: 15000,
    duration: "2",
    savings: 5000,
    interestRate: 10.5,
    currentSalaryLPA: 8,
    expectedSalaryUSD: 95000,
    targetCountry: "USA",
    workYears: 5
  });

  useEffect(() => {
    if (isDemoMode) {
      setInputs(prev => ({
        ...prev,
        programName: "MS Computer Science",
        tuition: 55000,
        currentSalaryLPA: 8.4,
        expectedSalaryUSD: 110000,
        targetCountry: "USA"
      }));
    }
  }, [isDemoMode]);

  // Derived Values
  const totals = useMemo(() => {
    const totalCost = inputs.tuition + (inputs.livingExpenses * parseFloat(inputs.duration));
    const loanNeeded = Math.max(0, totalCost - inputs.savings);
    
    const monthlyRate = (inputs.interestRate / 100) / 12;
    const months = 10 * 12; // 10 year standard tenure
    const emi = loanNeeded > 0 
      ? (loanNeeded * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
      : 0;

    return { totalCost, loanNeeded, emi };
  }, [inputs]);

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    if (isDemoMode) {
      await new Promise(r => setTimeout(r, 1500));
      setResult({
        breakEvenYears: 2,
        breakEvenMonths: 4,
        lifetimeGainINR: "₹8.4 Crores",
        cashFlowData: Array.from({ length: 60 }, (_, i) => ({
          month: i + 1,
          balance: i < 24 ? -60000 + (i * 2000) : (i - 24) * 8000
        })),
        aiInsight: "Arjun, your backend internship at Infosys positions you well for high-tier US roles. With a $110k starting salary, your ROI is exceptional.",
        optimization: "Targeting public universities in California (like UCSD) instead of private ones can save $40k in tuition.",
        risk: "Macroeconomic shifts in H1B quotas are your primary risk. Maintain a diversified job search strategy across US and Germany.",
        comparison: {
          withoutMS: { year1: "₹10L", year5: "₹18L", year10NetWorth: "₹1.2Cr" },
          withMS: { year1: "$110k", year5: "$165k", year10NetWorth: "₹9.8Cr" }
        }
      });
      setIsCalculating(false);
      return;
    }

    try {
      const data = await apiPost('/api/gemini/roi', { profile: inputs });
      setResult(data);
      if (!isDemoMode) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await awardXP(user.id, 'ROI_CALCULATOR');
          // Sync budget data back to user_profiles
          await syncProfileData(user.id, { budget: inputs.tuition + (inputs.livingExpenses * parseFloat(inputs.duration)) });
          // Save result to history
          await saveToolHistory(user.id, 'roi_calculator', inputs, data);
        }
      }
      toast.success("💰 +40 XP — Financial Planner Badge Unlocked!", {
        description: "Your comprehensive ROI analysis is complete. Profile data updated.",
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Analysis failed", {
        description: err.message || "Could not reach the AI financial engine."
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold font-outfit text-white tracking-tight">Financial ROI Engine</h1>
        <p className="text-muted-foreground font-mono text-sm max-w-2xl">
          Quantifying the true delta between staying in India vs. pursuing a Master&apos;s abroad.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {!result && !isCalculating ? (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid lg:grid-cols-12 gap-8"
          >
            {/* Left Panel - Investment */}
            <Card className="lg:col-span-6 bg-[#111827] border-white/10 shadow-2xl">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-lg font-outfit flex items-center text-primary">
                  <Calculator className="w-5 h-5 mr-3" /> Investment Side
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">University / Program</Label>
                  <Input 
                    placeholder="e.g. MS in Data Science, NYU" 
                    className="bg-white/5 border-white/10 h-12"
                    value={inputs.programName}
                    onChange={(e) => setInputs(p => ({ ...p, programName: e.target.value }))}
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Total Tuition ($)</Label>
                    <span className="text-primary font-bold font-space-mono">${inputs.tuition.toLocaleString()}</span>
                  </div>
                  <Slider 
                    value={[inputs.tuition]} 
                    min={20000} max={200000} step={1000}
                    onValueChange={(v: number | readonly number[]) => setInputs(p => ({ ...p, tuition: Array.isArray(v) ? v[0] : v }))}
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Living Expenses / Year ($)</Label>
                    <span className="text-primary font-bold font-space-mono">${inputs.livingExpenses.toLocaleString()}</span>
                  </div>
                  <Slider 
                    value={[inputs.livingExpenses]} 
                    min={8000} max={40000} step={500}
                    onValueChange={(v: number | readonly number[]) => setInputs(p => ({ ...p, livingExpenses: Array.isArray(v) ? v[0] : v }))}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Program Duration</Label>
                  <RadioGroup 
                    defaultValue="2" 
                    className="flex space-x-4"
                    onValueChange={(v) => setInputs(p => ({ ...p, duration: v }))}
                  >
                    {["1", "1.5", "2"].map(d => (
                      <div key={d} className="flex items-center space-x-2">
                        <RadioGroupItem value={d} id={`d-${d}`} className="border-primary text-primary" />
                        <Label htmlFor={`d-${d}`} className="text-sm cursor-pointer">{d} Year{d !== "1" && 's'}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5">
                   <div className="space-y-4">
                      <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Savings ($)</Label>
                      <Input 
                        type="number" 
                        value={inputs.savings}
                        className="bg-white/5 border-white/10"
                        onChange={(e) => setInputs(p => ({ ...p, savings: parseInt(e.target.value) || 0 }))}
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Loan Needed</Label>
                      <div className="text-2xl font-bold text-white font-space-mono">
                         ${totals.loanNeeded.toLocaleString()}
                      </div>
                      <p className="text-[10px] text-muted-foreground">EMI: ${Math.round(totals.emi)}/mo @ {inputs.interestRate}%</p>
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Return */}
            <Card className="lg:col-span-6 bg-[#111827] border-white/10 shadow-2xl">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-lg font-outfit flex items-center text-emerald-500">
                  <TrendingUp className="w-5 h-5 mr-3" /> Potential Return
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Current Salary (₹ LPA)</Label>
                    <span className="text-emerald-500 font-bold font-space-mono">₹{inputs.currentSalaryLPA}L</span>
                  </div>
                  <Slider 
                    value={[inputs.currentSalaryLPA]} 
                    min={0} max={30} step={0.5}
                    onValueChange={(v: number | readonly number[]) => setInputs(p => ({ ...p, currentSalaryLPA: Array.isArray(v) ? v[0] : v }))}
                  />
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Expected Post-MS Salary ($)</Label>
                    <span className="text-emerald-500 font-bold font-space-mono">${inputs.expectedSalaryUSD.toLocaleString()}</span>
                  </div>
                  <Slider 
                    value={[inputs.expectedSalaryUSD]} 
                    min={60000} max={180000} step={2000}
                    onValueChange={(v: number | readonly number[]) => setInputs(p => ({ ...p, expectedSalaryUSD: Array.isArray(v) ? v[0] : v }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Target Work Country</Label>
                    <Select defaultValue="USA" onValueChange={(v: string | null) => v && setInputs(p => ({ ...p, targetCountry: v }))}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111827] border-white/10">
                        <SelectItem value="USA">USA</SelectItem>
                        <SelectItem value="UK">UK</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="Germany">Germany</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Work Years Abroad</Label>
                    <Select defaultValue="5" onValueChange={(v: string | null) => v && setInputs(p => ({ ...p, workYears: parseInt(v) }))}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111827] border-white/10">
                        {[3, 5, 7, 10, 15].map(y => (
                          <SelectItem key={y} value={y.toString()}>{y} Years</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                   <p className="text-xs text-emerald-500/80 font-mono uppercase tracking-wider">Estimated Annual Savings Abroad</p>
                   <div className="text-3xl font-bold text-emerald-500 font-space-mono">
                      ~${Math.round(inputs.expectedSalaryUSD * 0.4).toLocaleString()}
                   </div>
                   <p className="text-[10px] text-muted-foreground italic">Factoring approx 25% tax and 35% living costs.</p>
                </div>

                <Button 
                  onClick={handleCalculate}
                  className="w-full h-14 bg-primary text-background font-bold text-lg shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)]"
                >
                  Calculate ROI Analysis <Zap className="ml-2 w-5 h-5 fill-background" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : isCalculating ? (
          <AILoadingState message="Crunching global tax datasets and salary benchmarks..." />
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <Card className="bg-[#111827] border-white/10 p-6">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Break-Even Point</p>
                  <div className="flex items-baseline space-x-1">
                     <span className="text-3xl font-bold font-outfit text-primary">{result.breakEvenYears}</span>
                     <span className="text-sm font-mono text-muted-foreground">Yrs</span>
                     <span className="text-2xl font-bold font-outfit text-primary ml-2 uppercase">{result.breakEvenMonths}</span>
                     <span className="text-sm font-mono text-muted-foreground">Mo</span>
                  </div>
                  <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: "65%" }} 
                        className="h-full bg-primary" 
                     />
                  </div>
               </Card>

               <Card className="bg-[#111827] border-white/10 p-6">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">10-Year Lifetime Gain</p>
                  <div className="text-3xl font-bold font-outfit text-emerald-500">{result.lifetimeGainINR}</div>
                  <p className="text-[10px] text-muted-foreground mt-2">Extra vs. staying in current role</p>
               </Card>

               <Card className="bg-[#111827] border-white/10 p-6">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Investment Efficiency</p>
                  <div className="text-3xl font-bold font-outfit text-white">4.2x</div>
                  <p className="text-[10px] text-muted-foreground mt-2">Earnings multiple over cost</p>
               </Card>

               <Card className="bg-primary/10 border-primary/20 p-6">
                  <p className="text-[10px] font-mono text-primary uppercase mb-2">Loan Clearance</p>
                  <div className="text-3xl font-bold font-outfit text-white">Month 28</div>
                  <p className="text-[10px] text-primary/70 mt-2">Earliest possible payoff</p>
               </Card>
            </div>

            {/* Main Viz Section */}
            <div className="grid lg:grid-cols-12 gap-8">
               <Card className="lg:col-span-8 bg-[#111827] border-white/10 p-8">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-bold flex items-center">
                       <LineChartIcon className="w-5 h-5 mr-3 text-primary" /> Monthly Net Worth Projection
                    </h3>
                    <div className="flex items-center space-x-4 text-[10px] font-mono">
                       <div className="flex items-center"><div className="w-3 h-3 bg-primary mr-2 rounded-sm" /> Abroad</div>
                       <div className="flex items-center"><div className="w-3 h-3 bg-white/20 mr-2 rounded-sm" /> India</div>
                    </div>
                  </div>
                  <div className="h-[350px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={result.cashFlowData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis 
                            dataKey="month" 
                            stroke="#6b7280" 
                            fontSize={10} 
                            tickFormatter={(v) => `M${v}`}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#6b7280" 
                            fontSize={10} 
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `$${v/1000}k`}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="#f59e0b" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                            animationDuration={2000}
                          />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="mt-8 flex items-center justify-center space-x-8 text-xs font-mono text-muted-foreground">
                     <div className="flex items-center">Repayment Phase <Info className="ml-1 w-3 h-3" /></div>
                     <div className="w-8 h-px bg-white/10" />
                     <div className="flex items-center text-primary">Break-Even Point</div>
                     <div className="w-8 h-px bg-white/10" />
                     <div className="flex items-center">Wealth Accumulation</div>
                  </div>
               </Card>

               <div className="lg:col-span-4 space-y-6">
                  <Card className="bg-primary/5 border border-primary/20 p-8">
                     <Zap className="w-8 h-8 text-primary mb-4 fill-primary/20" />
                     <h4 className="text-lg font-bold text-white mb-4">AI Strategic Insight</h4>
                     <p className="text-sm text-muted-foreground leading-relaxed italic">
                        &quot;{result.aiInsight}&quot;
                     </p>
                  </Card>

                  <Card className="bg-[#111827] border border-white/10 p-6 space-y-4">
                     <div className="flex items-start">
                        <Shield className="w-4 h-4 text-emerald-500 mr-3 shrink-0 mt-1" />
                        <div>
                           <p className="text-xs font-bold text-emerald-500 uppercase font-mono">Optimization Tip</p>
                           <p className="text-xs text-muted-foreground mt-1">{result.optimization}</p>
                        </div>
                     </div>
                     <div className="flex items-start">
                        <AlertCircle className="w-4 h-4 text-primary mr-3 shrink-0 mt-1" />
                        <div>
                           <p className="text-xs font-bold text-primary uppercase font-mono">Risk Profile</p>
                           <p className="text-xs text-muted-foreground mt-1">{result.risk}</p>
                        </div>
                     </div>
                  </Card>
               </div>
            </div>

            {/* Comparison Table */}
            <Card className="bg-[#111827] border-white/10 overflow-hidden">
               <div className="p-6 border-b border-white/5 flex items-center bg-white/[0.02]">
                  <TableIcon className="w-5 h-5 mr-3 text-muted-foreground" />
                  <h3 className="font-bold font-outfit">Side-by-Side Trajectory</h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-white/5 bg-white/[0.01]">
                           <th className="p-4 text-xs font-mono text-muted-foreground uppercase">Metric</th>
                           <th className="p-4 text-xs font-mono text-muted-foreground uppercase">Staying in India</th>
                           <th className="p-4 text-xs font-mono text-primary uppercase">Moving Abroad</th>
                        </tr>
                     </thead>
                     <tbody className="text-sm">
                        <tr className="border-b border-white/5">
                           <td className="p-4 font-bold text-muted-foreground">Year 1 Gross</td>
                           <td className="p-4">{result.comparison.withoutMS.year1}</td>
                           <td className="p-4 text-primary font-bold">{result.comparison.withMS.year1}</td>
                        </tr>
                        <tr className="border-b border-white/5">
                           <td className="p-4 font-bold text-muted-foreground">Year 5 Gross</td>
                           <td className="p-4">{result.comparison.withoutMS.year5}</td>
                           <td className="p-4 text-primary font-bold">{result.comparison.withMS.year5}</td>
                        </tr>
                        <tr className="border-b border-white/5">
                           <td className="p-4 font-bold text-muted-foreground">10-Year Net Worth</td>
                           <td className="p-4">{result.comparison.withoutMS.year10NetWorth}</td>
                           <td className="p-4 text-primary font-bold">{result.comparison.withMS.year10NetWorth}</td>
                        </tr>
                        <tr>
                           <td className="p-4 font-bold text-muted-foreground">Break-Even Status</td>
                           <td className="p-4">N/A</td>
                           <td className="p-4">
                              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold">YEAR {result.breakEvenYears}</span>
                           </td>
                        </tr>
                     </tbody>
                  </table>
               </div>
            </Card>

            <div className="flex justify-center space-x-4 pt-10">
               <Button variant="outline" className="border-white/10 text-emerald-500 hover:bg-emerald-500/5 h-12 px-8">
                  <Share2 className="w-4 h-4 mr-2" /> Share My ROI 💰
               </Button>
               <Button 
                 onClick={() => setResult(null)}
                 variant="outline" 
                 className="border-white/10 text-muted-foreground hover:bg-white/5 h-12 px-8"
               >
                 Run New Simulation
               </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
