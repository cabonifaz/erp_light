import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Esta función maneja si el usuario puede ver la página o no
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      // Lógica de protección
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirige a login
      } else if (isOnLogin) {
        if (isLoggedIn) {
          // Si ya está logueado, mandarlo al dashboard
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }
      return true;
    },
    // El JWT y Session sí pueden ir aquí porque manejan datos en memoria
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  providers: [], // Se deja vacío aquí para evitar cargar MySQL en el Edge
} satisfies NextAuthConfig;