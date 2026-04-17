'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('EduVerse Global Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center">
      <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full relative z-10 space-y-8"
      >
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold font-outfit text-white">Something went wrong</h2>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
            {error.digest ? `Error ID: ${error.digest}` : 'System synchronization disrupted'}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-sm text-muted-foreground leading-relaxed">
           Our systems encountered an unexpected hurdle while processing your request. Don't worry, your progress is saved.
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()}
            className="w-full h-12 bg-primary text-background font-bold"
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
          </Button>
          <Link href="/dashboard" className="w-full">
            <Button variant="outline" className="w-full h-12 border-white/10 text-white">
              <Home className="w-4 h-4 mr-2" /> Return to Command Center
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
