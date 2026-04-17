import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini, prompts } from '@/lib/gemini';
import { requireAuthAndCSRF } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sanitizeProfile } from '@/lib/sanitize';
import { AdmissionResultSchema, safeParse } from '@/lib/schemas/gemini-schemas';

export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuthAndCSRF(req);
    if (authError) return authError;

    const userId = (session?.user as { id: string }).id;
    const rateCheck = await checkRateLimit(userId, 'gemini/admission');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Resets at ${rateCheck.resetAt.toLocaleTimeString()}.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const profile = sanitizeProfile(body.profile || body);
    if (!profile) return NextResponse.json({ error: 'Profile is required' }, { status: 400 });

    const prompt = prompts.admission(profile);
    
    // Cache for 7 days
    const aiResponse = await generateWithGemini(prompt, 'admission', profile);
    
    const { data, error: parseError } = safeParse(AdmissionResultSchema, aiResponse);

    if (parseError || !data) {
      console.error('AI Response Validation Failed (Admission):', parseError);
      return NextResponse.json({ error: 'AI returned an invalid response format' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admission API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
