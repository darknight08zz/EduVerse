import { generateWithGemini, parseGeminiJSON } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? ((session.user as any).id || (session.user as any).sub || session.user.email) : null;

    if (!userId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(userId, 'gemini/sop-feedback');
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { sopText, university, program } = await req.json();

    const prompt = `Evaluate this Statement of Purpose for a ${program} application at ${university}. 
    Focus on authenticity, specificity, and program fit.
    
    Respond ONLY in this exact JSON format:
    {
      "overallScore": 85,
      "strengths": ["Clear technical narrative", "Strong opening anecdote"],
      "improvements": ["Needs more specific mention of university facilities", "Career goals could be more long-term"],
      "redFlags": ["Avoid mentions of high school achievements"]
    }
    
    SOP CONTENT:
    ${sopText}`;

    const aiResponse = await generateWithGemini(prompt);
    const parsed = parseGeminiJSON(aiResponse);

    return NextResponse.json(parsed || { 
      overallScore: 50, 
      strengths: ["Content generated"], 
      improvements: ["Manual review needed"], 
      redFlags: [] 
    });
  } catch (error) {
    console.error('SOP Feedback Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
