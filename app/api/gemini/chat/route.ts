import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';
import { requireAuthAndCSRF } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuthAndCSRF(req);
    if (authError) return authError;

    const rateCheck = await checkRateLimit((session?.user as any).id, 'gemini/chat');
    if (!rateCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: `Rate limit exceeded. Resets at ${rateCheck.resetAt.toLocaleTimeString()}.` 
      }), { status: 429 });
    }

    const { messages, userProfile } = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return new Response('GEMINI_API_KEY is not configured', { status: 500 });
    }

    // CAP CONTEXT WINDOW: Keep last 20 messages to prevent token overflow
    const MAX_HISTORY = 20;
    const cappedMessages = messages.length > MAX_HISTORY
      ? [
          ...messages.slice(0, 1), // Always keep the initial context/system query if present
          { role: 'assistant', content: '[Earlier conversation summarized for efficiency — continuing from recent messages]' },
          ...messages.slice(-MAX_HISTORY + 2) // Last 18 messages
        ]
      : messages;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const systemContext = `You are EduVerse Mentor, an expert study-abroad consultant specialized in helping Indian students pursue higher education internationally. You have 15 years of experience and have helped 10,000+ students.

Student Profile for Context:
Name: ${userProfile?.name || 'Student'}
Degree: ${userProfile?.current_degree || 'Not specified'}
GPA: ${userProfile?.gpa || 'Not specified'}
Target Countries: ${userProfile?.target_countries?.join(', ') || 'Not specified'}
Budget: $${userProfile?.budget_usd || 'Not specified'}/year

Your expertise covers:
1. Universities: US (Ivy League to State), UK (Russell Group), Canada, Germany, Australia, Singapore.
2. Test Prep: GRE, IELTS, TOEFL strategies.
3. Documents: SOP, LOR, Resume crafting.
4. Visas: F-1, UK Student Visa, German Blocked Account, etc.
5. Loans in India: SBI, Axis, HDFC Credila, Avanse, MPOWER, Prodigy.
6. Scholarships: Fulbright, Commonwealth, DAAD, Chevening, Merit Aid.
7. Post-Grad: OPT, CPT, job hunting.
8. Student Life: Indian communities, cultural adjustment.

Communication Style:
- Warm but direct (knowledgeable older cousin).
- Use Indian context (INR vs USD, reference Indian colleges).
- Be specific (name universities, amounts, deadlines).
- Use Markdown: **Bold** for keys, Numbered lists for steps, Bullet points for options.
- Callouts: > [!IMPORTANT] (for critical warnings).
- Always end with ONE actionable next step.

Guardrails:
- Never guarantee admission or loan approval.
- Never give definitive visa advice (refer to authorized agents).
- Use real data only. Redirect if asked outside domain.`;

    const chat = model.startChat({
      history: cappedMessages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      systemInstruction: systemContext
    });

    const result = await chat.sendMessageStream(cappedMessages[cappedMessages.length - 1].content);
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(new TextEncoder().encode(text));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
