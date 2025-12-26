import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
// 1. IMPORTAR EL TOASTER DE SONNER
import { Toaster } from "@/components/ui/sonner"; 
// 2. IMPORTAR EL PROVEEDOR DE SESIÓN (NUEVO)
import { AuthProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GTERP Light",
  description: "Sistema de Gestión Empresarial Integral",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body 
        // SOLUCIÓN: Agrega esta propiedad aquí para silenciar el error de Grammarly
        suppressHydrationWarning={true} 
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        {/* 3. ENVOLVER TODO EL CONTENIDO CON AUTHPROVIDER */}
        <AuthProvider>
            {children}
            
            {/* 4. AGREGAR EL COMPONENTE AQUÍ (SONNER) */}
            <Toaster />
        </AuthProvider>
        
      </body>
    </html>
  );
}