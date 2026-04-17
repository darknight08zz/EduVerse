import { generateWithGemini, parseGeminiJSON } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id || session.user.email;
    const rateCheck = await checkRateLimit(userId, 'gemini/sop');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Resets at ${rateCheck.resetAt.toLocaleTimeString()}.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { loanProduct, program, university, country, hasCoSigner } = body;
    
    const prompt = `
      You are an expert education loan consultant. 
      Generate a specific, comprehensive document checklist for a student with this profile:
      - Loan Product: ${loanProduct}
      - Program: ${program}
      - University: ${university}
      - Country: ${country}
      - Has Co-signer: ${hasCoSigner ? 'Yes' : 'No'}

      Include specific Indian documents (e.g., PAN card, Form 16, IT returns for co-siner).
      Focus on what this specific lender (${loanProduct}) typically requires.

      Respond ONLY in this exact JSON format:
      {
        "categories": [
          {
            "name": "Academic Documents",
            "documents": ["Degree Certificate", "Transcripts (all semesters)", "Admission Letter"]
          },
          {
            "name": "Financial Documents (Student)",
            "documents": ["Bank Statement (6 months)", "PAN/Aadhar Card"]
          },
          {
             "name": "Financial Documents (Co-signer)",
             "documents": ["IT Returns (2 years)", "Salary Slips", "Property Papers if collateral"]
          }
        ]
      }
    `;

    const aiResponse = await generateWithGemini(prompt);
    const parsed = parseGeminiJSON(aiResponse);

    return NextResponse.json(parsed || { categories: [] });
  } catch (err: unknown) {
    console.error('Loan Checklist API Error:', err);
    return NextResponse.json({ error: 'Failed to generate checklist' }, { status: 500 });
  }
}
