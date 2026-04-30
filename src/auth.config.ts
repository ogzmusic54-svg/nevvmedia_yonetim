import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/giris",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/giris");
      const isOnApp =
        nextUrl.pathname === "/" ||
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/musteriler") ||
        nextUrl.pathname.startsWith("/gorevler") ||
        nextUrl.pathname.startsWith("/faturalar") ||
        nextUrl.pathname.startsWith("/teklifler") ||
        nextUrl.pathname.startsWith("/sozlesmeler") ||
        nextUrl.pathname.startsWith("/dosyalar") ||
        nextUrl.pathname.startsWith("/kullanicilar") ||
        nextUrl.pathname.startsWith("/ayarlar") ||
        nextUrl.pathname.startsWith("/profil");

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      if (isOnApp) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "EMPLOYEE";
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 gün
  },
  providers: [],
} satisfies NextAuthConfig;
