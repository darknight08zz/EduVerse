"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, Wallet, BookOpen, LineChart, MessageSquare, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NAVBAR_LINKS = [
  { name: "Career Navigator", href: "/career-navigator", icon: GraduationCap },
  { name: "ROI Calculator", href: "/roi-calculator", icon: LineChart },
  { name: "Admission Predictor", href: "/admission-predictor", icon: BookOpen },
  { name: "Mentor Chat", href: "/mentor-chat", icon: MessageSquare },
  { name: "Loan Estimator", href: "/loan-estimator", icon: Wallet },
];

export default function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 glass">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="text-background w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-sans">
            Edu<span className="text-primary italic">Verse</span>
          </span>
        </Link>

        {isLanding && (
          <div className="hidden md:flex items-center space-x-8">
            {NAVBAR_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:bg-white/5">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary text-background hover:bg-primary/90">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
