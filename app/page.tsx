"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  GraduationCap, 
  LineChart, 
  BookOpen, 
  MessageSquare, 
  Wallet,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Star
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useDemoMode } from "@/contexts/DemoContext";

const TYPING_PHRASES = [
  "Find your perfect university",
  "Predict your admission odds",
  "Plan your finances",
  "Get your loan approved"
];

const FEATURES = [
  {
    title: "Career Navigator",
    desc: "AI-driven matching for countries and programs based on your unique profile.",
    icon: GraduationCap,
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    title: "ROI Calculator",
    desc: "Flash-powered salary predictions vs cost of education analysis.",
    icon: LineChart,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "Admission Predictor",
    desc: "Analyze your profile against 1000+ top global universities.",
    icon: BookOpen,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    title: "Mentor Chatbot",
    desc: "24/7 access to AI mentors specializing in study-abroad planning.",
    icon: MessageSquare,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    title: "Loan Estimator",
    desc: "Instant matching with top-tier education loan products.",
    icon: Wallet,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10"
  }
];

export default function LandingPage() {
  const [index, setIndex] = useState(0);
  const { enterDemoMode } = useDemoMode();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % TYPING_PHRASES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white selection:bg-primary selection:text-background">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden bloomberg-grid">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-mono font-bold tracking-widest uppercase mb-6">
                <Zap className="w-3 h-3 mr-2 fill-primary" /> Multi-Agent AI Student Copilot
              </span>
              <h1 className="text-5xl md:text-7xl font-bold font-outfit tracking-tight mb-6">
                Your AI Copilot for the <br />
                <span className="text-primary italic">Study Abroad Journey</span>
              </h1>
              
              <div className="h-12 flex items-center justify-center mb-8">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="text-2xl md:text-3xl font-space-mono text-muted-foreground"
                  >
                    {TYPING_PHRASES[index]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6 mb-12">
                <Link href="/signup">
                  <Button className="h-14 px-8 bg-primary text-black font-bold text-lg rounded-xl hover:bg-primary/90 hover:scale-105 transition-all">
                    Start Your Journey Free <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button 
                  onClick={enterDemoMode}
                  variant="outline" 
                  className="h-14 px-8 border-primary/20 bg-primary/5 text-primary font-bold text-lg rounded-xl hover:bg-primary/10 transition-all font-mono tracking-tighter"
                >
                  🎭 TRY LIVE DEMO
                </Button>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center -space-x-2 mb-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a0f1e] bg-muted flex items-center justify-center overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <div className="flex justify-center text-primary mb-1">
                    <Star className="w-4 h-4 fill-primary" />
                    <Star className="w-4 h-4 fill-primary" />
                    <Star className="w-4 h-4 fill-primary" />
                    <Star className="w-4 h-4 fill-primary" />
                    <Star className="w-4 h-4 fill-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono underline decoration-primary/30">10,000+ students guided</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-24 px-4 bg-black/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold font-outfit mb-4">Five Modules. One Unified Solution.</h2>
              <p className="text-muted-foreground">Everything you need from profile building to loan approval.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative p-6 rounded-2xl glass hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6 transition-transform group-hover:-translate-y-1`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-bold mb-3 font-outfit">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                  <div className="mt-6 flex items-center text-primary text-xs font-mono font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    Verify Probablity <ChevronRight className="ml-1 w-3 h-3" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Gamification Teaser */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="max-w-5xl mx-auto glass p-12 rounded-3xl border-primary/20 relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Star className="w-32 h-32 text-primary" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold font-outfit mb-6">Gamify Your Future.</h2>
                <div className="space-y-6">
                  {[
                    { label: "Earn XP for every action you take", icon: Zap },
                    { label: "Unlock premium AI university reports", icon: ShieldCheck },
                    { label: "Maintain streaks to build discipline", icon: TrendingUp },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center text-primary">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-lg font-outfit">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-muted-foreground uppercase">Live Dashboard Demo</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
                  <div className="h-10 w-full bg-primary/10 border border-primary/20 rounded-lg flex items-center px-4">
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '65%' }}
                        className="h-full bg-primary"
                      />
                    </div>
                    <span className="ml-4 text-xs font-mono text-primary font-bold">Lvl 4</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-white/5 rounded-lg border border-white/5" />
                    <div className="h-20 bg-white/5 rounded-lg border border-white/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-white/10 text-center text-muted-foreground text-sm font-mono">
        <p>© {new Date().getFullYear()} EduVerse — Production Protocol 1.0. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
