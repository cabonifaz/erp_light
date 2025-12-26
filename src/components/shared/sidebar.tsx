'use client'

import { useState } from "react"; // 1. Importamos useState
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  FileText,
  Truck,
  ClipboardList,
  Search // 2. Importamos el icono de búsqueda
} from "lucide-react";

// Tu lista de opciones (sin cambios)
export const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ventas/ordenes", label: "Ventas & OC", icon: ShoppingCart },
  { href: "/compras/solicitudes", label: "Solicitudes Compra", icon: ClipboardList },
  { href: "/compras/registro", label: "Ingresar Facturas", icon: Truck },
  { href: "/inventario/", label: "Inventario", icon: Package },
  { href: "/clientes", label: "Clientes / Proveedores", icon: Users },
  { href: "/reportes", label: "Reportes", icon: FileText },
  { href: "/configuracion/empresa", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(""); // 3. Estado del buscador

  // 4. Lógica de filtrado
  const filteredItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col h-screen fixed left-0 top-0 z-10">
      
      {/* HEADER LOGO */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <span className="text-xl font-bold text-blue-700">GTERP Light</span>
      </div>
      
      {/* 5. NUEVO: CAMPO DE BÚSQUEDA */}
      <div className="p-3 pb-0">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar módulo..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredItems.length === 0 ? (
           // Mensaje si no hay resultados
           <div className="px-3 py-4 text-center">
             <p className="text-sm text-gray-400">No se encontraron opciones</p>
           </div>
        ) : (
          filteredItems.map((item) => {
            const Icon = item.icon;
            // Usamos startsWith para mantener activo si estás en una sub-ruta interna
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500")} />
                {item.label}
              </Link>
            );
          })
        )}
      </nav>

      {/* FOOTER USUARIO */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                AD
            </div>
            <div className="text-xs">
                <p className="font-medium text-gray-900">Usuario Conectado</p>
                <p className="text-gray-500 text-[10px]">Sistema ERP</p>
            </div>
        </div>
      </div>
    </aside>
  );
}