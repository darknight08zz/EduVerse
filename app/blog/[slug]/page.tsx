import { supabase } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, Sparkles } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!post) return notFound();

  // Increment view count (async, fire and forget)
  supabase.from('blog_posts').update({ view_count: (post.view_count || 0) + 1 }).eq('id', post.id);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white selection:bg-primary selection:text-background">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <article className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <header className="space-y-8">
            <Link href="/blog">
               <button className="flex items-center text-xs font-mono text-muted-foreground hover:text-primary transition-colors group">
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> BACK TO JOURNAL
               </button>
            </Link>
            
            <div className="space-y-4">
               <div className="flex items-center space-x-4 text-xs font-mono text-primary font-bold">
                  <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5" /> {new Date(post.published_at).toLocaleDateString()}</span>
                  <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5" /> 8 min read</span>
                  <span className="bg-primary/10 px-2 py-0.5 rounded border border-primary/20 flex items-center">
                     <Sparkles className="w-3 h-3 mr-1.5" /> AI AGENT GENERATED
                  </span>
               </div>
               <h1 className="text-4xl md:text-6xl font-bold font-outfit leading-tight">{post.title}</h1>
            </div>
          </header>

          {/* Hero Decoration */}
          <div className="h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full" />

          {/* Content */}
          <div className="prose prose-invert prose-emerald max-w-none 
            prose-headings:font-outfit prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-primary
            prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-lg
            prose-li:text-muted-foreground prose-strong:text-white prose-strong:font-bold
            prose-blockquote:border-l-primary prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl
          ">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Footer CTA */}
          <section className="mt-20 p-10 rounded-3xl bg-primary border border-primary/20 shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                   <h3 className="text-2xl font-black text-background font-space-mono lowercase tracking-tighter uppercase">Ready to be the next success story?</h3>
                   <p className="text-background/80 font-bold">Don't just read about success—build it with EduVerse's AI-powered mission tools.</p>
                </div>
                <div className="flex md:justify-end">
                   <Link href="/signup">
                      <Button className="h-14 px-8 bg-background text-primary font-bold text-lg rounded-xl hover:scale-105 transition-transform">
                         Start Free Journey <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                   </Link>
                </div>
             </div>
          </section>

          {/* Social Share */}
          <footer className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center space-x-4">
                <span className="text-xs font-mono text-muted-foreground">SHARE INSIGHT:</span>
                <button className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"><Share2 className="w-4 h-4" /></button>
             </div>
             <Link href="/blog">
                <Button variant="ghost" className="text-xs font-mono text-muted-foreground hover:text-white">READ NEXT ARTICLE <ArrowRight className="ml-2 w-3 h-3" /></Button>
             </Link>
          </footer>
        </article>
      </main>
    </div>
  );
}
