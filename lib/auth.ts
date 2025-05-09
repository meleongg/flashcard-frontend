import { PrismaAdapter } from "@auth/prisma-adapter";
import jwt from "jsonwebtoken";
import { getServerSession, NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        // Sign a short-lived JWT for backend use using NextAuth secret
        session.accessToken = jwt.sign(
          { id: token.id },
          process.env.NEXTAUTH_SECRET!,
          { algorithm: "HS256", expiresIn: "1h" }
        );
      }
      return session;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
