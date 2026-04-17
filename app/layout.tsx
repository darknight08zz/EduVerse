import type { Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { validateEnv } from "@/lib/env";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: 'EduVerse — AI-Powered Study Abroad Companion',
  description: 'Discover universities, predict admission odds, calculate your ROI, and get your education loan — all powered by AI. Built for Indian students planning higher studies abroad.',
  keywords: ['study abroad', 'education loan India', 'MS abroad', 'GRE', 'university admission', 'AI career navigator'],
  openGraph: {
    title: 'EduVerse — Your AI Study Abroad Copilot',
    description: 'AI-powered platform for Indian students planning higher studies abroad. Career Navigator, Admission Predictor, ROI Calculator, Loan Estimator.',
    type: 'website',
    url: 'https://eduverse-demo.vercel.app',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EduVerse Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduVerse — AI Study Abroad Copilot',
    description: 'Career Navigator, Admission Predictor, ROI Calculator, Loan Estimator — all free for Indian students.',
  },
};

validateEnv();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${spaceMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <DemoProvider>
              <Toaster position="top-center" theme="dark" richColors />
              {children}
            </DemoProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
