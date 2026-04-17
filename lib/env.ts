// lib/env.ts
const REQUIRED_ENV_VARS = [
  'GEMINI_API_KEY',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  if (missing.length > 0) {
    // During Build phase on Vercel, some environment variables might not be needed for static generation
    // but we still want to warn. We'll only throw at runtime in production.
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    
    if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    } else {
      console.warn(`⚠️ [Env Validation] Missing variables: ${missing.join(', ')}`);
      if (isBuildPhase) {
        console.warn('💡 Build proceeding anyway. Ensure these are set in your Vercel Dashboard for runtime.');
      }
    }
  }
}
