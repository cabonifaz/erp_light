import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const [result]: any = await pool.query(
            "CALL sp_buscar_usuario_login(?)",
            [credentials.email]
          );

          const user = result[0]?.[0];

          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (passwordsMatch) {
            // Lógica defensiva para detectar Sucursal y Rol (por si cambian nombres de columnas)
            const sucursalDetectada = user.branch_name || user.sucursal || user.nombre_sucursal || "Sin Sucursal";
            const rolDetectado = user.role || user.code || user.rol;

            return {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              role: rolDetectado, // <--- Dato crucial para la validación
              branch_name: sucursalDetectada, 
            };
          }
          
          return null;

        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // 1. Guardamos los datos de la BD en el Token
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.branch_name = user.branch_name;
      }
      return token;
    },
    // 2. Pasamos los datos del Token a la Sesión (Frontend)
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.branch_name = token.branch_name as string;
      }
      return session;
    },
  },
});