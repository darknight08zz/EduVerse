import { generateWithGemini } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndCSRF } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limiter';
import { DeadlineSchema, safeParse } from '@/lib/schemas/gemini-schemas';

export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuthAndCSRF(req);
    if (authError) return authError;

    const { universityName, program } = await req.json();
    
    // Using a shared rate limit key for gemini requests
    const rateCheck = await checkRateLimit((session?.user as any).id, 'gemini/deadline');
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const prompt = `You are an expert academic advisor.
    Provide the typical application deadline for international students at ${universityName} for the ${program} program (Fall intake).
    
    Respond ONLY in this exact JSON format:
    {
      "deadline": "YYYY-MM-DD",
      "round": "Regular Decision",
      "note": "Verify on official website"
    }
    
    If you are unsure of the exact date, use null for the deadline field but provide a typical month in the note.
    Focus on US/UK/Canada/Germany/Australia standards.`;

    const cacheInputs = { universityName, program };
    const aiResponse = await generateWithGemini(prompt, 'deadline', cacheInputs);
    
    const { data, error: parseError } = safeParse(DeadlineSchema, aiResponse);

    if (parseError || !data) {
       return NextResponse.json({ deadline: null, round: "N/A", note: "Could not estimate deadline reliably" });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Deadline API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
