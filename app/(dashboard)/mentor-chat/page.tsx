"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Zap,
  GraduationCap,
  History,
  LayoutDashboard,
  MessageSquare,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  PlusCircle,
  Clock
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Message, saveChatSession, getChatSessions } from "@/lib/chat";
import { cn } from "@/lib/utils";
import { awardXP } from "@/lib/gamification";

const QUICK_QUESTIONS = [
  "What universities should I target?",
  "How do I write a strong SOP?",
  "What are my loan options?",
  "When should I start applying?",
  "What scholarships can I get?"
];

import { useDemoMode } from "@/contexts/DemoContext";

interface UserProfile {
  id: string;
  name?: string;
  current_degree?: string;
  gpa?: string | number;
  budget_usd?: number;
}

interface ChatSession {
  id: string;
  messages: Message[];
  created_at: string;
}

export default function MentorChat() {
  const { isDemoMode, demoProfile } = useDemoMode();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);
  const [followups, setFollowups] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      if (isDemoMode) {
        setProfile(demoProfile);
        setHistory([
          { 
            id: 'demo-1', 
            created_at: new Date(Date.now() - 86400000).toISOString(),
            messages: [
              { role: 'user', content: 'What are my chances at UCSD?', timestamp: new Date(Date.now() - 86410000).toISOString() },
              { role: 'model', content: "Based on your GPA of 8.4 and GRE of 318, you have a **Moderate** chance at UCSD's MS CS program. Focusing on a strong technical SOP will be key.", timestamp: new Date(Date.now() - 86405000).toISOString() }
            ] 
          }
        ]);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load Profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profile);

      // Load History
      const chats = await getChatSessions(user.id);
      setHistory(chats);
    };
    loadData();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (content: string = input) => {
    const text = content.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setFollowups([]);

    // Gamification: First message (+10 XP)
    if (messages.length === 0) {
      setSessionXP(prev => prev + 10);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !isDemoMode) await awardXP(user.id, 'MENTOR_CHAT_START');
      } catch (e) {
        console.error("Failed to award XP:", e);
      }
      toast.success("🚀 +10 XP — Mentor Session Started!", {
        description: "Your first message in this session has earned you points."
      });
    }

    // Gamification: Milestone (+15 XP)
    if (newMessages.length > 0 && newMessages.length % 6 === 0) {
      setSessionXP(prev => prev + 15);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !isDemoMode) await awardXP(user.id, 'MENTOR_CHAT_PER_5_MESSAGES');
      } catch (e) {
        console.error("Failed to award XP:", e);
      }
      toast.info("🧠 +15 XP — Deep Dive Bonus!", {
        description: "You're asking great questions. Keep it up!"
      });
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userProfile: profile
        })
      });

      if (!response.ok) throw new Error("Failed to fetch");

      // Handle Streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      
      setMessages(prev => [...prev, { role: 'model', content: '', timestamp: new Date().toISOString() }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        
        setMessages(prev => {
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, content: assistantContent }];
        });
      }

      // Save to Supabase after stream completes
      if (user) {
        const result = await saveChatSession(user.id, [...newMessages, { role: 'model', content: assistantContent, timestamp: new Date().toISOString() }], sessionId);
        if (!sessionId && result?.id) setSessionId(result.id);
      }

      // Generate Follow-ups
      const fuResponse = await fetch('/api/gemini/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastMessage: assistantContent })
      });
      const fuData = await fuResponse.json();
      setFollowups(fuData.followups || []);

    } catch (err) {
      console.error(err);
      toast.error("Bridge Connection Lost", {
        description: "The AI Mentor is currently offline. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="grid lg:grid-cols-10 h-[calc(100vh-140px)] gap-6">
      {/* Sidebar - Profile & Context */}
      <aside className="lg:col-span-3 space-y-6 flex flex-col h-full">
        <Card className="bg-[#111827] border-white/10 shrink-0">
          <CardHeader className="p-4 border-b border-white/5 flex flex-row items-center space-x-3">
             <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
             </div>
             <div>
                <CardTitle className="text-sm font-outfit">{profile?.name || "Student Profile"}</CardTitle>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{profile?.current_degree || "Setup Pending"}</p>
             </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
             <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">GPA</span>
                <span className="text-white font-bold">{profile?.gpa || "--"}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Budget</span>
                <span className="text-white font-bold">
                   {profile?.budget_usd ? `$${(profile.budget_usd / 1000).toFixed(0)}k/yr` : "--"}
                </span>
             </div>
             <div className="pt-3 border-t border-white/5">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-mono text-muted-foreground uppercase">Session XP</span>
                   <span className="text-xs text-primary font-bold">+{sessionXP} XP</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (sessionXP/100)*100)}%` }} className="h-full bg-primary" />
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-white/10 flex-1 flex flex-col overflow-hidden">
           <CardHeader className="p-4 border-b border-white/5 shrink-0">
              <CardTitle className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center">
                 <History className="w-3 h-3 mr-2" /> Recent Sessions
              </CardTitle>
           </CardHeader>
           <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                 {history.length > 0 ? history.map((session) => (
                   <button 
                    key={session.id} 
                    onClick={() => {
                      setMessages(session.messages);
                      setSessionId(session.id);
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all flex items-start space-x-3 group",
                      sessionId === session.id ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5 border border-transparent"
                    )}
                   >
                      <MessageSquare className="w-4 h-4 text-muted-foreground mt-1 shrink-0 group-hover:text-primary" />
                      <div>
                         <p className="text-xs font-medium text-white line-clamp-1">{session.messages[session.messages.length - 1]?.content || "Empty Session"}</p>
                         <div className="flex items-center text-[10px] text-muted-foreground mt-1">
                            <Clock className="w-2 h-2 mr-1" /> {new Date(session.created_at).toLocaleDateString()}
                         </div>
                      </div>
                   </button>
                 )) : (
                    <div className="p-8 text-center space-y-2 opacity-50">
                       <LayoutDashboard className="w-8 h-8 mx-auto text-muted-foreground" />
                       <p className="text-[10px] font-mono uppercase">No History Found</p>
                    </div>
                 )}
              </div>
           </ScrollArea>
           <div className="p-4 border-t border-white/5 shrink-0">
               <Button 
                variant="ghost" 
                onClick={() => {
                  setMessages([]);
                  setSessionId(undefined);
                  setSessionXP(0);
                }}
                className="w-full h-10 border border-dashed border-white/10 text-muted-foreground hover:text-white hover:border-white/20 text-xs"
               >
                  <PlusCircle className="w-4 h-4 mr-2" /> Start New Session
               </Button>
           </div>
        </Card>
      </aside>

      {/* Main Chat Interface */}
      <Card className="lg:col-span-7 bg-[#0a0f1e] border-white/10 flex flex-col overflow-hidden relative shadow-2xl">
         <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none bloomberg-grid" />
         
         <CardHeader className="p-4 border-b border-white/10 backdrop-blur-md bg-[#111827]/80 shrink-0 z-10 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
               <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
               </div>
               <div>
                  <h3 className="text-sm font-bold font-outfit text-white">EduVerse Mentor</h3>
                  <div className="flex items-center space-x-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[10px] font-mono text-muted-foreground uppercase">Gemini 1.5 Flash Online</span>
                  </div>
               </div>
            </div>
         </CardHeader>

         {/* Chat View */}
         <ScrollArea className="flex-1 p-6 z-0">
            <div className="space-y-8 max-w-4xl mx-auto">
               <AnimatePresence>
                  {messages.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="text-center py-20 space-y-6"
                    >
                       <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 relative">
                          <Bot className="w-10 h-10 text-primary" />
                          <div className="absolute -top-1 -right-1">
                             <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                             </span>
                          </div>
                       </div>
                       <h2 className="text-2xl font-bold font-outfit text-white">How can I guide you today?</h2>
                       <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                          Your senior consultant for US/UK/Canada admits, financial planning, and career transitions.
                       </p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-6 max-w-lg mx-auto">
                          {QUICK_QUESTIONS.map(q => (
                             <Button 
                              key={q} 
                              variant="outline" 
                              onClick={() => handleSend(q)}
                              className="bg-white/5 border-white/10 hover:border-primary/40 hover:bg-primary/5 text-xs text-muted-foreground h-12 justify-between group"
                             >
                                {q} <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                             </Button>
                          ))}
                       </div>
                    </motion.div>
                  ) : messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn("flex group", msg.role === 'user' ? "justify-end" : "justify-start")}
                    >
                       <div className={cn("flex max-w-[85%] space-x-3", msg.role === 'user' && "flex-row-reverse space-x-reverse")}>
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1",
                            msg.role === 'user' ? "bg-white/10" : "bg-primary/20 text-primary"
                          )}>
                             {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </div>
                          
                          <div className="space-y-2">
                             <div className={cn(
                               "p-5 rounded-2xl border leading-relaxed text-sm prose prose-invert prose-sm max-w-none shadow-lg",
                               msg.role === 'user' 
                                 ? "bg-amber-500 text-background font-medium border-amber-600 shadow-amber-500/10" 
                                 : "bg-[#111827] text-white border-white/10 shadow-black/50"
                             )}>
                                {msg.role === 'user' ? (
                                   <p>{msg.content}</p>
                                ) : (
                                   <ReactMarkdown>{msg.content}</ReactMarkdown>
                                )}
                             </div>
                             
                             {/* Message Actions */}
                             <div className={cn("flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity", msg.role === 'user' && "justify-end")}>
                                <button onClick={() => copyToClipboard(msg.content)} className="text-muted-foreground hover:text-white transition-colors"><Copy className="w-3 h-3" /></button>
                                {msg.role === 'model' && (
                                   <>
                                      <button className="text-muted-foreground hover:text-emerald-500 transition-colors"><ThumbsUp className="w-3 h-3" /></button>
                                      <button className="text-muted-foreground hover:text-red-500 transition-colors"><ThumbsDown className="w-3 h-3" /></button>
                                   </>
                                )}
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  ))}
               </AnimatePresence>
               
               {isLoading && messages[messages.length-1]?.role === 'user' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start space-x-3">
                     <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                     </div>
                     <div className="bg-[#111827] p-5 rounded-2xl border border-white/10 flex items-center space-x-3">
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                     </div>
                  </motion.div>
               )}

               {/* Follow-up Chips */}
               {followups.length > 0 && !isLoading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 pt-4">
                     {followups.map((fu, i) => (
                       <button 
                        key={i} 
                        onClick={() => handleSend(fu)}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-primary hover:bg-primary/10 hover:border-primary/40 transition-all font-medium"
                       >
                          {fu}
                       </button>
                     ))}
                  </motion.div>
               )}
               <div ref={scrollRef} />
            </div>
         </ScrollArea>

         {/* Chat Input */}
         <div className="p-6 border-t border-white/10 bg-[#111827]/80 backdrop-blur-xl shrink-0">
            <div className="relative max-w-4xl mx-auto flex items-center bg-white/[0.03] rounded-2xl border border-white/10 focus-within:border-primary/50 transition-all px-5 h-16 shadow-inner">
               <input
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 placeholder="Ask your mentor about universities, loans, or SOP writing..."
                 disabled={isLoading}
                 className="flex-1 bg-transparent border-none text-white focus:ring-0 placeholder:text-muted-foreground font-sans text-base"
               />
               <Button 
                size="icon" 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-primary text-background hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
               >
                  <Send className="w-5 h-5 fill-current" />
               </Button>
            </div>
         </div>
      </Card>
    </div>
  );
}
