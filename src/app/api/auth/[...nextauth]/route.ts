import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // thêm scope nếu cần:
      // authorization: { params: { scope: "openid email profile" } }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ profile }) {
      const userEmail = (profile as any)?.email;

      if (!userEmail) return false; // ko có email -> reject

      // kiểm tra domain
      const allowedDomain = "hcmut.edu.vn";
      const domain = userEmail.split("@")[1]?.toLowerCase();
      if (domain !== allowedDomain) {
        return false;
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      // lưu dữ liệu account/profile nếu cần
      if (account) token.accessToken = account.access_token;
      return token;
    },
    async session({ session, token }) {
      // expose thêm fields cho client
      (session as any).accessToken = (token as any).accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };