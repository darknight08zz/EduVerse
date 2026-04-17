"use client";

import Sidebar from "@/components/layout/Sidebar";
import { useDemoMode } from "@/contexts/DemoContext";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { usePathname } from "next/navigation";

const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.15, ease: "easeIn" } },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDemoMode, demoProfile, exitDemoMode } = useDemoMode();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#0a0f1e]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        {isDemoMode && (
          <div className="bg-primary px-4 py-2 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center text-background font-bold text-xs font-mono uppercase tracking-widest">
              <Sparkles className="w-4 h-4 mr-2 fill-background" />
              Demo Mode &mdash; Exploring as {demoProfile.name} | {demoProfile.degree} | GPA {demoProfile.gpa}
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/signup">
                <button className="text-[10px] font-black uppercase tracking-tighter bg-background text-primary px-4 py-1.5 rounded-full hover:bg-white transition-colors">
                  Sign Up Free <ArrowRight className="inline w-3 h-3 ml-1" />
                </button>
              </Link>
              <button 
                onClick={exitDemoMode}
                className="text-background/60 hover:text-background text-[10px] font-mono uppercase"
              >
                Exit Demo
              </button>
            </div>
          </div>
        )}
        <div className="p-4 md:p-8 lg:p-12 bloomberg-grid">
           <AnimatePresence mode="wait">
             <motion.div
               key={pathname}
               variants={pageVariants}
               initial="initial"
               animate="enter"
               exit="exit"
             >
               {children}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
