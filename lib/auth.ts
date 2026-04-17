import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";

const isProd = process.env.NODE_ENV === 'production';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "EduVerse Demo",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Check Demo Fallback
        if (credentials.email === "demo@eduverse.app" && credentials.password === "demo1234") {
          return { id: "demo-user-123", name: "Demo Scholar", email: "demo@eduverse.app" };
        }

        // 2. Check Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) {
          // Check for specific Supabase error: "Email not confirmed"
          if (error?.message?.toLowerCase().includes("email not confirmed")) {
            throw new Error("Email not confirmed. Please check your inbox for the verification link.");
          }
          throw new Error(error?.message || "Invalid email or password");
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        };
      }
    })
  ],

  // Secure cookie configuration
  cookies: {
    sessionToken: {
      name: isProd ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  pages: {
    signIn: '/login',
    newUser: '/onboarding',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) (token as any).id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "credentials") {
         // Using supabase client (linked to anon key) - this works because the user profile check
         // is simple, but for inserts we might need service role if RLS is strict.
         const { data: existing } = await supabase
           .from('user_profiles')
           .select('id')
           .eq('id', user.id)
           .single();

         if (!existing) {
             const { error } = await supabase.from('user_profiles').insert({
               id: user.id,
               name: user.name,
               xp_points: 0,
               streak_days: 1,
               last_active: new Date().toISOString()
             });
             
             if (error) {
               console.error("Error creating user profile:", error);
               // We don't necessarily want to block the login if profile creation fails,
               // but we should log it.
             }
         }
      }
      return true;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
