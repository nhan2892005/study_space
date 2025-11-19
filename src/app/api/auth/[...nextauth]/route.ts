import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import { createToken } from '@/lib/jwt';

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

      if (!userEmail) {
        return false;
      }

      // Kiểm tra domain
      const allowedDomains = ["hcmut.edu.vn", "gmail.com"];
      const domain = userEmail.split("@")[1]?.toLowerCase();

      if (!allowedDomains.includes(domain)) {
        return false;
      }

      // Extract role from redirect URI if available
      let roleFromUrl: string | null = null;
      if (account?.redirect_uri && typeof account.redirect_uri === 'string') {
        try {
          const url = new URL(account.redirect_uri);
          const role = url.searchParams.get("role");
          // Kiểm tra role hợp lệ (dạng String)
          if (role === "MENTOR" || role === "MENTEE" || role === "ADMIN") {
            roleFromUrl = role;
          }
        } catch (error) {
          console.error("Error parsing redirect URI:", error);
        }
      }
      
      try {
        // Tìm hoặc tạo user trong database
        // FIX: Bỏ 'image', 'emailVerified' và đổi 'role' thành 'userType'
        const user = await prisma.user.upsert({
          where: { email: userEmail },
          update: {
            name: (profile as any)?.name || null,
            // image: (profile as any)?.picture || null, // <-- XÓA VÌ DB KHÔNG CÓ
            // emailVerified: new Date(), // <-- XÓA VÌ DB KHÔNG CÓ
          },
          create: {
            email: userEmail,
            name: (profile as any)?.name || null,
            // image: ... <-- XÓA
            userType: (roleFromUrl ?? "MENTEE"), // <-- ĐỔI role THÀNH userType
            // emailVerified: ... <-- XÓA
            accountStatus: "Active",
          },
        });

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      
      if (token.email) {
        // Fetch user from database
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { 
            id: true,
            userType: true, // <-- ĐỔI role THÀNH userType
            name: true,
            email: true
          }
        });
        
        if (dbUser) {
          token.role = dbUser.userType; // Map userType từ DB vào token.role cho Frontend dùng
          token.sub = dbUser.id;
          token.name = dbUser.name;
          token.email = dbUser.email;
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        
        if (token.email && token.sub) {
          const jwtToken = createToken({
            userId: token.sub as string,
            email: token.email as string,
            name: token.name as string || undefined,
          });
          
          session.accessToken = jwtToken;
        }
      }
      
      return session;
    },
  },
  
  pages: {
    signIn: '/',
    error: '/',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };