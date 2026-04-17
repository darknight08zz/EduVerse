import { generateWithGemini, parseGeminiJSON } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndCSRF } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuthAndCSRF(req);
    if (authError) return authError;

    const userId = (session?.user as { id: string }).id;
    const rateCheck = await checkRateLimit(userId, 'gemini/chat');
    if (!rateCheck.allowed) {
      return NextResponse.json({ followups: [] });
    }

    const { lastMessage } = await req.json();
    
    const prompt = `
      You are an expert study-abroad consultant assistant.
      Based on the last AI response: "${lastMessage}"
      Generate 2-3 short, contextual follow-up question chips for the student.
      Respond ONLY in this exact JSON format:
      {
        "followups": ["Short Question 1?", "Short Question 2?", "Short Question 3?"]
      }
    `;

    const aiResponse = await generateWithGemini(prompt);
    const parsed = parseGeminiJSON(aiResponse);

    return NextResponse.json(parsed || { followups: [] });
  } catch (err: unknown) {
    console.error('Follow-up API Error:', err);
    return NextResponse.json({ followups: [] });
  }
}
