import { z } from 'zod';

export const CareerResultSchema = z.object({
  countryRecommendations: z.array(z.object({
    country: z.string(),
    fitScore: z.number().min(0).max(100),
    reasoning: z.string(),
    topUniversities: z.array(z.object({
      name: z.string(),
      program: z.string(),
      tuition: z.string(),
      ranking: z.string(),
    })).length(3),
    postStudyVisa: z.string(),
    jobMarketScore: z.number().min(0).max(100),
  })).min(1).max(5),
  programRecommendations: z.array(z.object({
    program: z.string(),
    fitScore: z.number().min(0).max(100),
    reasoning: z.string(),
  })).min(1).max(5),
  careerTrajectory: z.object({
    year1: z.object({ role: z.string(), salaryUSD: z.string(), salaryINR: z.string() }),
    year3: z.object({ role: z.string(), salaryUSD: z.string(), salaryINR: z.string() }),
    year5: z.object({ role: z.string(), salaryUSD: z.string(), salaryINR: z.string() }),
  }),
  keyInsight: z.string(),
});

export const AdmissionResultSchema = z.object({
  probability: z.number().min(0).max(100),
  zone: z.enum(['low', 'moderate', 'good', 'safety']),
  academicScore: z.number().min(0).max(100),
  researchScore: z.number().min(0).max(100),
  workExpScore: z.number().min(0).max(100),
  sopPotential: z.number().min(0).max(100),
  extracurricularScore: z.number().min(0).max(100),
  strengths: z.array(z.string()).min(1).max(5),
  weaknesses: z.array(z.string()).min(1).max(4),
  improvements: z.array(z.object({
    action: z.string(),
    probabilityBoost: z.number(),
  })).max(5),
  aiInsight: z.string(),
});

export const ROIInsightSchema = z.object({
  insight: z.string(),
  risk: z.string(),
  optimization: z.string(),
  roiMultiplier: z.number().optional(),
});

export const DeadlineSchema = z.object({
  deadline: z.string().nullable(),
  round: z.string(),
  note: z.string(),
});

/**
 * Safe parser utility for Gemini AI responses.
 * Cleans markdown formatting and validates against a Zod schema.
 */
export function safeParse<T>(
  schema: z.ZodType<T>,
  raw: string
): { data: T; error: null } | { data: null; error: string } {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    const result = schema.safeParse(parsed);

    if (result.success) {
      return { data: result.data, error: null };
    } else {
      console.error('[Zod] Validation failed:', result.error.issues);
      return { data: null, error: result.error.issues[0]?.message || 'Response shape mismatch' };
    }
  } catch (err) {
    console.error('[JSON] Parse failed:', err);
    return { data: null, error: 'AI returned invalid JSON format' };
  }
}
