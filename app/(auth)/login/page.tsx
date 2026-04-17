"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Lock, ArrowRight, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials", {
          description: "Use demo@eduverse.app / demo1234 for testing."
        });
      } else {
        toast.success("Welcome back!");
        router.push("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl mb-6">
            <GraduationCap className="w-10 h-10 text-background" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Edu<span className="text-primary italic">Verse</span></h1>
          <p className="text-muted-foreground mt-2 font-mono text-xs uppercase tracking-widest">Master's Dream Navigator</p>
        </div>

        <Card className="bg-[#111827]/80 border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold font-outfit text-white">Sign In</CardTitle>
            <p className="text-sm text-muted-foreground">Enter your credentials to access your roadmap.</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase text-muted-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="email"
                    required
                    placeholder="demo@eduverse.app"
                    className="bg-white/5 border-white/10 pl-10 h-11 focus:ring-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs font-mono uppercase text-muted-foreground">Password</Label>
                  <Link href="#" className="text-[10px] text-primary hover:underline uppercase">Forgot?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    required
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 pl-10 h-11 focus:ring-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button disabled={isLoading} type="submit" className="w-full h-12 bg-primary text-background font-bold text-lg shadow-xl shadow-primary/20">
                {isLoading ? "Signing in..." : "Continue"} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#111827] px-2 text-muted-foreground font-mono">Or connect with</span>
              </div>
            </div>

            <Button 
                variant="outline" 
                className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white h-11"
                onClick={() => signIn("google")}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google Account
            </Button>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-6 text-center border-t border-white/5 bg-white/[0.01]">
            <p className="text-xs text-muted-foreground">
              Don't have an account? <Link href="/signup" className="text-primary font-bold hover:underline">Sign Up Free</Link>
            </p>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center space-x-3 text-left">
               <Zap className="w-5 h-5 text-primary shrink-0" />
               <p className="text-[10px] text-muted-foreground leading-relaxed">
                 <span className="text-primary font-bold">Demo Mode:</span> Try all modules without an account by using the demo credentials provided.
               </p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
