export interface UserProfile {
  id: string;
  name: string;
  current_degree: string;
  graduation_year: number;
  gpa: number;
  gre_score?: number;
  ielts_score?: number;
  target_countries: string[];
  target_programs: string[];
  budget_usd: number;
  xp_points: number;
  streak_days: number;
  last_active: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  module: 'mentor' | 'career' | 'roi' | 'admission' | 'loan';
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ToolUsage {
  id: string;
  user_id: string;
  tool_name: string;
  used_at: string;
  xp_earned: number;
}

export interface LoanProduct {
  provider: string;
  interestRate: number;
  maxAmount: number;
  tenureYears: number;
  processingFee: number;
}
