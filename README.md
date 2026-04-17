# EduVerse — AI-Powered Study Abroad Companion 🎓

EduVerse is a unified, high-fidelity platform designed specifically for Indian students navigating the complex journey of international education. By bridging the gap between career discovery and financial execution, EduVerse uses Gemini 1.5 Flash to provide personalized, data-driven academic roadmaps.

![EduVerse Dashboard](https://images.unsplash.com/photo-1523050335392-9ae38d19a793?auto=format&fit=crop&q=80&w=1200)

## 🚀 Vision
To democratize expert study-abroad consulting through specialized AI, making global education accessible and financially transparent for every student.

## ✨ Core Features

### 1. Career Navigator 🗺️
*   **AI Discovery**: Specialized profile analysis (GPA, Field, Goals) to match with top global programs.
*   **Skill Gaps**: Identifies what you need to master before you apply.

### 2. ROI Calculator 💰
*   **Financial Clarity**: Side-by-side wealth trajectory analysis (India vs. Abroad).
*   **Break-Even Tracking**: Know exactly which year you'll pay off your investment.

### 3. Admission Predictor 🎯
*   **Heuristic Modeling**: Heuristic profile strength analysis with radar charts.
*   **Improvement Roadmap**: AI-generated action items to boost your admission odds.

### 4. Conversational AI Mentor 💬
*   **24/7 Support**: Expert advice on SOPs, LORs, Visa processes, and living abroad.
*   **Persistent Memory**: Remembers your profile across all modules.

### 5. Loan Estimator 🏦
*   **Lender Matching**: Weighted rule-based matching with SBI, HDFC, MPOWER, and more.
*   **AI Document Roadmap**: Personalized checklist based on your selected lender.

### 6. Gamification & Growth ⚡
*   **Progressive Levels**: Explorer → Researcher → Applicant → Scholar → Global Student.
*   **XP Rewards**: Earned for every strategic action taken on the platform.

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS / Vanilla CSS (Rich Aesthetics)
- **Animations**: Framer Motion
- **AI**: Google Gemini 1.5 Flash
- **Database/Auth**: Supabase + NextAuth
- **Charts**: Recharts

## 📦 Getting Started

### Prerequisites
- Node.js 18.x or higher
- A Google Cloud Project for Gemini API
- A Supabase Project

### Step-by-Step Setup

1. **Clone the Repo**
   ```bash
   git clone https://github.com/your-repo/eduverse.git
   cd eduverse
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   # AI
   GEMINI_API_KEY=your_gemini_key

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=any_long_secret_string
   GOOGLE_CLIENT_ID=your_google_id
   GOOGLE_CLIENT_SECRET=your_google_secret

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup**
   Run the SQL provided in `supabase_migration.sql` in your Supabase SQL Editor.

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🔐 Demo Credentials
You can test the full platform using these credentials:
*   **Email**: `demo@eduverse.app`
*   **Password**: `demo1234`

## 🌍 Deployment
Deploying to Vercel is highly recommended:
1. Connect your GitHub repository to Vercel.
2. Add the environment variables listed above.
3. Vercel will automatically detect Next.js and deploy.

---
Built with ❤️ by the EduVerse Team for the future leaders of the world.
