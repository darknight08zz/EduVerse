import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini, prompts } from '@/lib/gemini';
import { requireAuthAndCSRF } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sanitizeProfile } from '@/lib/sanitize';
import { ROIInsightSchema, safeParse } from '@/lib/schemas/gemini-schemas';

export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuthAndCSRF(req);
    if (authError) return authError;

    const userId = (session?.user as { id: string }).id;
    const rateCheck = await checkRateLimit(userId, 'gemini/roi');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Resets at ${rateCheck.resetAt.toLocaleTimeString()}.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const profile = sanitizeProfile(body.profile || body);
    if (!profile) return NextResponse.json({ error: 'Profile is required' }, { status: 400 });

    const prompt = prompts.roi(profile);
    
    // Cache for 3 days as defined in gemini-cache.ts
    const aiResponse = await generateWithGemini(prompt, 'roi', profile);
    
    const { data, error: parseError } = safeParse(ROIInsightSchema, aiResponse);

    if (parseError || !data) {
      console.error('AI Response Validation Failed (ROI):', parseError);
      return NextResponse.json({ error: 'AI returned an invalid response format' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('ROI API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
