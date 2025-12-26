'use client'

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { menuItems } from "./sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
// Importamos el UserNav
import { UserNav } from "./user-nav";

// Definimos las props que espera el Header
interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
    branch_name?: string | null; // <--- AGREGAR
  }
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-20 md:ml-64">
      
      {/* 1. BOTÓN MENÚ MÓVIL */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6 text-gray-700" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="left" className="w-64 p-0">
             <div className="px-6 py-4 border-b">
                <SheetTitle className="text-xl font-bold text-blue-700">GTERP Light</SheetTitle>
                <SheetDescription className="text-xs text-gray-500">Menú de navegación</SheetDescription>
            </div>

            <nav className="flex flex-col gap-1 p-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                      isActive 
                        ? "bg-blue-50 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-blue-600" : "text-gray-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Título de sección (Visible en escritorio) */}
      <h2 className="hidden md:block text-sm font-semibold text-gray-500 uppercase tracking-wider">
        Panel de Control
      </h2>

      {/* Logo o Título en móvil */}
      <span className="md:hidden text-lg font-bold text-blue-700">GTERP</span>

      {/* 2. AQUÍ MOSTRAMOS EL USUARIO O EL BOTÓN DE SALIR */}
      <div className="flex items-center gap-2">
        {user ? (
            // Si hay usuario, mostramos el menú completo con avatar
            <UserNav user={user} />
        ) : (
            // Fallback por si acaso no llega el usuario (opcional)
            <span className="text-sm text-gray-400">Cargando...</span>
        )}
      </div>
    </header>
  );
}