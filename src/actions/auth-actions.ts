'use server'

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    // 1. CAPTURAR EL VALOR (Opcional: Para lógica futura o logs)
    // El checkbox envía 'on' si está marcado, o null si no lo está.
    const remember = formData.get('remember') === 'on';

    // Nota: NextAuth v5 por defecto mantiene la sesión por 30 días (persistent).
    // Si quisieras que el checkbox cambie esto dinámicamente, se requiere 
    // lógica avanzada en la configuración de la cookie, pero por ahora 
    // pasamos el formData tal cual para que el login funcione.

    // 2. INICIAR SESIÓN
    await signIn('credentials', formData);

  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Credenciales inválidas. Revisa tu correo o contraseña.';
        default:
          return 'Ocurrió un error inesperado. Intenta de nuevo.';
      }
    }
    // Importante: Next.js usa un error de tipo "Redirect" para navegar al dashboard.
    // Debemos relanzar el error si no es de tipo AuthError.
    throw error; 
  }
}