import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { accounts, db, sessions, users, verificationTokens } from "@/db/schema";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
});
