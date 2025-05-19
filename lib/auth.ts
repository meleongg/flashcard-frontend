import { PrismaAdapter } from "@auth/prisma-adapter";
import jwt from "jsonwebtoken";
import { getServerSession, NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";

type UserSettingsRow = {
  onboarding_completed: boolean;
};

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
    async jwt({ token, user, account, isNewUser }) {
      if (user) token.id = user.id;

      // For new logins, set initial state
      if (account && account.providerAccountId) {
        token.isNewUser = isNewUser;
      }

      // Important: Check database for onboarding status on EVERY token refresh
      // This ensures that after onboarding completes, the next page load will have updated status
      if (token.id) {
        try {
          // Use raw SQL query with explicit typing
          const result = await db.$queryRaw<UserSettingsRow[]>`
            SELECT onboarding_completed
            FROM "UserSettings"
            WHERE user_id = ${token.id}
          `;

          // Now TypeScript knows result[0] structure
          if (
            result &&
            result.length > 0 &&
            result[0].onboarding_completed === true
          ) {
            token.isNewUser = false;
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;

        // Pass the new user flag to the session
        session.isNewUser = !!token.isNewUser;

        // Sign a short-lived JWT for backend use using NextAuth secret
        session.accessToken = jwt.sign(
          { id: token.id },
          process.env.NEXTAUTH_SECRET!,
          { algorithm: "HS256", expiresIn: "1h" }
        );
      }
      return session;
    },

    // Add this redirect callback
    async redirect({ url, baseUrl }) {
      // If the user was redirected to a specific page, honor that
      if (url.startsWith(baseUrl)) return url;

      // Default redirect to dashboard - we'll handle onboarding redirect in the page component
      return `${baseUrl}/dashboard`;
    },
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
