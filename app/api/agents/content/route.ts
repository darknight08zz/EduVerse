import { NextResponse } from 'next/server';
import { generateWithGemini, parseGeminiJSON } from '@/lib/gemini';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const topics = [
    'Best universities for MS CS in USA 2025 for Indian students',
    'GRE score requirements for top 20 US universities',
    'Education loan comparison: SBI vs HDFC Credila vs Avanse',
    'F-1 visa interview tips for Indian students 2025',
    'ROI of MS abroad: Is it worth the investment in 2025?',
    'Top stem courses in Canada for 2025 intake',
    'How to write a winning SOP for German public universities'
  ];
  
  const today = new Date().getDay();
  const topic = topics[today % topics.length];
  
  const prompt = `Write a comprehensive, SEO-optimized blog post for EduVerse about: "${topic}"

Target audience: Indian students (B.Tech/BCA/BBA/B.Com) planning to study abroad for Masters.

Structure:
- Title (H1): Include target keyword
- Slug: URL-friendly version of title
- Introduction (150 words): Hook + what they will learn
- 4-5 main sections (H2) with 200 words each
- Key takeaways (bulleted)
- Meta Description: 155 chars max
- CTA: "Use EduVerse's free AI tools to plan your journey →"

Tone: Friendly, specific, data-driven. Include realistic numbers (salary ranges, loan amounts, visa timelines).
Length: 900-1100 words.

Respond ONLY with this JSON format:
{
  "title": "Post Title",
  "slug": "post-slug-url",
  "content": "Full markdown content here...",
  "metaDescription": "SEO meta description"
}`;

  try {
    const result = await generateWithGemini(prompt);
    const post = parseGeminiJSON(result);

    if (!post || !post.title || !post.content) {
      throw new Error("Invalid response from Gemini");
    }
    
    // Save to Supabase blog_posts table
    const { error } = await supabase.from('blog_posts').insert({
      title: post.title,
      slug: post.slug || post.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
      content: post.content,
      meta_description: post.metaDescription,
      generated_by_ai: true,
      published_at: new Date().toISOString()
    });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `AI Content Agent: Published "${post.title}"`,
      post: {
        title: post.title,
        slug: post.slug
      }
    });

  } catch (err: any) {
    console.error("Agent Content Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
