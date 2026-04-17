import { generateWithGemini, prompts } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndCSRF } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sanitizeProfile } from '@/lib/sanitize';
import { CareerResultSchema, safeParse } from '@/lib/schemas/gemini-schemas';

export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuthAndCSRF(req);
    if (authError) return authError;

    const rateCheck = await checkRateLimit((session?.user as any).id, 'gemini/career');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Resets at ${rateCheck.resetAt.toLocaleTimeString()}.` },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    const profile = sanitizeProfile(rawBody);
    
    const prompt = prompts.career(profile);

    // Enable caching for the career endpoint
    const result = await generateWithGemini(prompt, 'career', profile);
    
    const { data, error: parseError } = safeParse(CareerResultSchema, result);

    if (parseError || !data) {
      console.error('AI Response Validation Failed:', parseError);
      return NextResponse.json({ error: 'AI returned an invalid response format. Please try again.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
