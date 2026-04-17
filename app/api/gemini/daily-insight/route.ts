import { generateWithGemini } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndCSRF } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuthAndCSRF(req);
    if (authError) return authError;

    const userId = (session?.user as { id: string }).id;
    const rateCheck = await checkRateLimit(userId, 'gemini/daily');
    if (!rateCheck.allowed) {
      return NextResponse.json({ tip: "💡 Take a break! Too many insights for today." });
    }

    const { userProfile } = await req.json();
    
    const season = new Date().getMonth() >= 8 ? "application season" : "preparation phase";
    
    const prompt = `
      You are EduVerse AI Insight Engine. 
      Generate a single, short, high-impact study abroad tip (max 2 sentences) for a student with this profile:
      - Current Degree: ${userProfile?.current_degree || "Undergraduate"}
      - Target Countries: ${userProfile?.target_countries?.join(', ') || "Global"}
      - Phase: ${season}

      Make it specific to Indian students (e.g. mention SBI loans, IELTS prep, or F1 visa dates).
      The tip should be actionable and motivating.
      Format: "💡 Today's Insight: [Tip]"
      Respond with ONLY the text.
    `;

    const tip = await generateWithGemini(prompt);

    return NextResponse.json({ tip });
  } catch (err: unknown) {
    console.error('Daily Insight API Error:', err);
    return NextResponse.json({ tip: "💡 Today's Insight: Start your SOP draft early to highlight your unique career trajectory." });
  }
}
