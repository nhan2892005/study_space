import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { 
        params: { 
          scope: "openid email profile",
          prompt: "select_account" 
        } 
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ profile, account }) {
      const userEmail = (profile as any)?.email;

      if (!userEmail) return false;

      // Kiểm tra domain
      const allowedDomain = "hcmut.edu.vn";
      const domain = userEmail.split("@")[1]?.toLowerCase();
      if (domain !== allowedDomain) {
        return false;
      }

      // Get role from URL query parameter
      let roleFromUrl: UserRole | null = null;
      if (account?.redirect_uri && typeof account.redirect_uri === 'string') {
        const url = new URL(account.redirect_uri);
        const role = url.searchParams.get("role");
        if (role === "MENTOR" || role === "MENTEE" || role === "ADMIN") {
          roleFromUrl = role;
        }
      }
      
      try {
        // Tìm hoặc tạo user trong database
        const user = await prisma.user.upsert({
          where: { email: userEmail },
          update: {
            name: profile?.name || null,
            image: (profile as any)?.picture || null,
            emailVerified: new Date(),
          },
          create: {
            email: userEmail,
            name: profile?.name || null,
            image: (profile as any)?.picture || null,
            role: roleFromUrl || "MENTEE", // Default to MENTEE if no role specified
            emailVerified: new Date(),
          },
        });

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
    async jwt({ token, trigger, session }) {
      if (trigger === "update" && session?.role) {
        // Allow role updates through session
        token.role = session.role;
      }

      if (!token.role) {
        // Get user role from database
        const user = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { role: true },
        });
        token.role = user?.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.role) {
        (session as any).user.role = token.role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };