import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  url: process.env.NEXTAUTH_URL,
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // On first sign in, store the user ID from the provider
      if (account && user) {
        // Use the Google user ID (providerAccountId) as the stable identifier
        // This ensures the same Google account always gets the same user ID
        token.sub = account.providerAccountId || token.sub;
        token.email = user.email || token.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // Use the stable user ID from the token (Google user ID)
        session.user.id = token.sub as string;
        // Ensure email is also set
        if (token.email) {
          session.user.email = token.email as string;
        }
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
})

