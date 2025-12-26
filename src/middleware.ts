import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Exportamos directamente la función auth configurada con la versión ligera
export default NextAuth(authConfig).auth;

export const config = {
  // Excluimos archivos estáticos y APIs internas
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};