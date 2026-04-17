// lib/sanitize.ts

// Strips characters that could be used for prompt injection
export function sanitizeText(input: string, maxLength = 500): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/[<>{}[\]\\]/g, '')          // strip angle brackets, braces, brackets
    .replace(/\n{3,}/g, '\n\n')           // collapse excessive newlines
    .replace(/system:|assistant:|user:/gi, '') // strip role injection keywords
    .trim();
}

export function sanitizeNumber(input: unknown, min: number, max: number, fallback: number): number {
  const n = Number(input);
  if (isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeStringArray(input: unknown, allowed: string[]): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter(item => typeof item === 'string' && allowed.includes(item))
    .slice(0, 10); // max 10 items
}

export interface StudentProfile {
  degree?: string;
  field?: string;
  gpa?: number | string;
  gre?: number | string;
  ielts?: number | string;
  workExp?: number | string;
  countries?: string[];
  careerGoal?: string;
  budget?: number | string;
}

// Validate and sanitize a full student profile before passing to Gemini
export function sanitizeProfile(raw: StudentProfile) {
  const ALLOWED_COUNTRIES = ['USA', 'UK', 'Canada', 'Germany', 'Australia', 'Singapore', 'India', 'Europe'];

  return {
    degree: sanitizeText(raw.degree || '', 100),
    field: sanitizeText(raw.field || '', 100),
    gpa: sanitizeNumber(raw.gpa, 0, 10, 0),
    gre: raw.gre ? sanitizeNumber(raw.gre, 260, 340, 300) : null,
    ielts: raw.ielts ? sanitizeNumber(raw.ielts, 0, 9, 0) : null,
    workExp: sanitizeNumber(raw.workExp, 0, 20, 0),
    countries: sanitizeStringArray(raw.countries, ALLOWED_COUNTRIES),
    careerGoal: sanitizeText(raw.careerGoal || '', 300),
    budget: sanitizeNumber(raw.budget, 10000, 200000, 50000),
  };
}
