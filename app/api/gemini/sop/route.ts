import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sanitizeText } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? ((session.user as any).id || (session.user as any).sub || session.user.email) : null;

    if (!userId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateCheck = await checkRateLimit(userId, 'gemini/sop');
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { profile, sopData } = await req.json();

    const prompt = `You are an expert SOP writer who has helped 500+ Indian students get into top global universities. You write compelling, authentic, and specific Statements of Purpose — never generic, never templated.

Write a complete Statement of Purpose for this student:

STUDENT PROFILE:
- Name: ${sanitizeText(profile.name)}
- Degree: ${sanitizeText(profile.degree)} in ${sanitizeText(profile.field)}, GPA: ${profile.gpa}
- GRE: ${profile.gre || 'Not taken'}, IELTS: ${profile.ielts || 'Not taken'}
- Work Experience: ${profile.workExp} years
- Internship/Work: ${sanitizeText(profile.workDetails || 'Not specified')}

TARGET APPLICATION:
- University: ${sanitizeText(sopData.university)}
- Program: ${sanitizeText(sopData.program)}
- Why this university/program: ${sanitizeText(sopData.whyUniversity)}
- Intake: ${sopData.intake}

STUDENT'S OWN WORDS:
- Relevant experience: ${sanitizeText(sopData.relevantExperience)}
- Problem they want to solve: ${sanitizeText(sopData.problemStatement)}
- Key achievement: ${sanitizeText(sopData.achievement)}
- 5-year goal: ${sanitizeText(sopData.fiveYearGoal)}

WRITING REQUIREMENTS:
1. Length: 850-950 words exactly
2. Tone: Confident, specific, authentic — sounds like a smart Indian student, not a corporate brochure
3. Opening: Start with a specific anecdote, observation, or insight — NOT "I have always been passionate about..."
4. Be specific: reference actual skills, tools, coursework by name (infer from degree/field)
5. Paragraph 4 must mention 1-2 specific aspects of the target program or university that align with the student's interests (be realistic, don't make up specific professor names)
6. Ending: Forward-looking, ties back to the opening theme
7. NEVER use these phrases: "I have always been passionate", "Since childhood", "I am a hard-working individual", "In conclusion"

Respond with ONLY the SOP text — no preamble, no "Here is your SOP:", no markdown headers. Just the raw SOP text starting with the opening sentence.`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (error) {
    console.error('SOP Generation Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
