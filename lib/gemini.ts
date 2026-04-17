import { GoogleGenerativeAI } from '@google/generative-ai';
import { makeCacheKey, getCached, setCached } from './gemini-cache';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface StudentProfile {
  name?: string;
  degree?: string;
  field?: string;
  gpa: number;
  graduationYear?: number;
  targetCountries?: string[]; // Used in UI/Database
  countries?: string[];       // Used in some API logic
  budget: number;
  tuition?: number;
  gre?: string | number | null;
  ielts?: string | number | null;
  workExp?: string | number;
  careerGoal?: string;
  programName?: string;
  targetCountry?: string;
  currentSalaryLPA?: number;
  expectedSalaryUSD?: number;
  duration?: number;
  uniName?: string;
  faangIntern?: boolean;
  research?: boolean;
}

export const geminiFlash = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1000,
  }
});

/**
 * Executes a function with exponential backoff retry.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const error = err as Error;
      lastError = error;
      const isRetryable =
        error.message.includes('503') ||
        error.message.includes('429') ||
        error.message.includes('timeout') ||
        error.message.includes('UNAVAILABLE');

      if (!isRetryable || attempt === maxAttempts - 1) throw lastError;

      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Main AI generation utility with Caching, Retries, and 25s Timeout.
 */
export async function generateWithGemini(
  prompt: string,
  cacheEndpoint?: string,
  cacheInputs?: object
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is missing.');
    return "AI service is not configured.";
  }

  // 1. Check cache first
  let cacheKey = '';
  if (cacheEndpoint && cacheInputs) {
    cacheKey = makeCacheKey(cacheEndpoint, cacheInputs);
    const cached = await getCached(cacheKey);
    if (cached) {
      console.log(`[AI Cache HIT] ${cacheEndpoint}`);
      return cached;
    }
  }

  // 2. Call Gemini with retry + timeout
  try {
    const result = await withRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25s limit

      try {
        const genResult = await geminiFlash.generateContent(prompt);
        const response = await genResult.response;
        clearTimeout(timeout);
        return response.text();
      } catch (err) {
        clearTimeout(timeout);
        throw err;
      }
    });

    // 3. Store in cache if successful
    if (cacheKey && cacheEndpoint) {
      await setCached(cacheKey, cacheEndpoint, result);
    }

    return result;
  } catch (error) {
    console.error('Gemini error:', error);
    throw new Error('AI service temporarily unavailable. Please try again.');
  }
}

/**
 * Helper to clean and parse JSON from Gemini's response
 * (Used as fallback or for unstructured endpoints)
 */
export function parseGeminiJSON(text: string) {
  try {
    const clean = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse Gemini JSON fallback:", e);
    return null;
  }
}

/**
 * Centralized prompts for EduVerse AI features.
 */
export const prompts = {
  career: (profile: StudentProfile) => `You are EduVerse's AI Career Navigator specialized in international education for Indian students.
Analyze this student profile and provide structured recommendations:
Student Profile:
- Current Degree: ${profile.degree} in ${profile.field}
- GPA: ${profile.gpa}
- GRE: ${profile.gre || 'Not taken'}
- IELTS: ${profile.ielts || 'Not taken'}
- Work Experience: ${profile.workExp} years
- Target Destinations: ${profile.countries?.join(', ') || profile.targetCountries?.join(', ') || 'Global'}
- Career Goal: ${profile.careerGoal}
- Annual Budget (USD): $${profile.budget}

Respond ONLY in this exact JSON format:
{
  "countryRecommendations": [
    {
      "country": "USA",
      "fitScore": 85,
      "reasoning": "2-3 sentence reasoning",
      "topUniversities": [
        {"name": "University Name", "program": "MS in X", "tuition": "$45,000/year", "ranking": "#12 globally"},
        {"name": "University Name", "program": "MS in X", "tuition": "$38,000/year", "ranking": "#28 globally"},
        {"name": "University Name", "program": "MS in X", "tuition": "$28,000/year", "ranking": "#45 globally"}
      ],
      "postStudyVisa": "OPT: 3 years STEM extension available",
      "jobMarketScore": 88
    }
  ],
  "programRecommendations": [
    {
      "program": "MS in Computer Science - Machine Learning Track",
      "fitScore": 92,
      "reasoning": "Why this fits the student's profile in 2 sentences"
    }
  ],
  "careerTrajectory": {
    "year1": {"role": "Software Engineer", "salaryUSD": "$95,000 - $115,000", "salaryINR": "₹79L - ₹96L"},
    "year3": {"role": "Senior Software Engineer", "salaryUSD": "$130,000 - $160,000", "salaryINR": "₹1.08Cr - ₹1.33Cr"},
    "year5": {"role": "Staff Engineer / Engineering Manager", "salaryUSD": "$170,000 - $220,000", "salaryINR": "₹1.42Cr - ₹1.83Cr"}
  },
  "keyInsight": "One powerful 2-sentence insight about this student's specific opportunity"
}`,

  roi: (profile: StudentProfile) => `You are an AI Financial Advisor for international students.
Analyze the ROI for this master's program:
- Program: ${profile.programName} in ${profile.targetCountry}
- Tuition: $${profile.tuition} | Duration: ${profile.duration}yr
- Current India Salary: ₹${profile.currentSalaryLPA}L
- Expected Post-MS Salary: $${profile.expectedSalaryUSD}

Respond ONLY in JSON:
{
  "breakEvenYears": 2,
  "breakEvenMonths": 4,
  "lifetimeGainINR": "₹8.4 Crores",
  "cashFlowData": [{"month": 1, "balance": -50000}],
  "aiInsight": "2-sentence strategic financial advice",
  "optimization": "One tip to improve ROI",
  "risk": "One primary financial risk",
  "comparison": {
    "withoutMS": {"year1": "₹10L", "year5": "₹18L", "year10NetWorth": "₹1.2Cr"},
    "withMS": {"year1": "$100k", "year5": "$150k", "year10NetWorth": "₹8Cr"}
  }
}`,

  admission: (profile: StudentProfile) => `Act as an Ivy League admissions officer.
Evaluate this student profile for ${profile.uniName} (${profile.programName}):
- GPA: ${profile.gpa} | GRE: ${profile.gre}
- FAANG Intern: ${profile.faangIntern ? 'Yes' : 'No'}
- Research: ${profile.research ? 'Yes' : 'No'}

Respond ONLY in JSON:
{
  "probability": 75,
  "zone": "moderate",
  "aiInsight": "2-sentence candid assessment",
  "radarData": [{"subject": "Academic", "A": 80}],
  "liftingUp": ["Strength 1"],
  "draggingDown": ["Weakness 1"],
  "improvements": [{"action": "Do X", "boost": "+5%"}]
}`,
};
