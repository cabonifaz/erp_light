'use client'

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, FilterX, Calendar, Check, ChevronsUpDown, Lock, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InventoryFiltersProps {
    branches: { id: number; name: string }[];
    products: { id: number; name: string; code: string }[];
    userBranchId: number;
    userRole: string;
}

export function InventoryFilters({ branches, products, userBranchId, userRole }: InventoryFiltersProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    // Lógica de Permisos
    const PRIVILEGED_ROLES = ['CEO', 'LOGISTICA', 'ADMINISTRADOR GENERAL'];
    const isRestricted = !PRIVILEGED_ROLES.includes(userRole);

    // --- ESTADOS LOCALES (No afectan la URL todavía) ---
    // Inicializamos con lo que venga en la URL o vacío
    const [branchId, setBranchId] = useState(searchParams.get("branchId") || "");
    const [query, setQuery] = useState(searchParams.get("query") || "");
    const [minStock, setMinStock] = useState(searchParams.get("minStock") || "");
    const [maxStock, setMaxStock] = useState(searchParams.get("maxStock") || "");
    const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");

    // Estado para el Combobox de Productos
    const [openProduct, setOpenProduct] = useState(false);
    
    // Efecto: Pre-seleccionar sucursal si es la primera vez o si está restringido
    useEffect(() => {
        // Si la URL no tiene sucursal y el usuario tiene una asignada...
        if (!searchParams.get("branchId") && userBranchId) {
            setBranchId(userBranchId.toString());
        }
    }, [userBranchId, searchParams]);

    // --- ACCIÓN: APLICAR FILTROS (Actualiza la URL) ---
    const applyFilters = () => {
        const params = new URLSearchParams();
        
        if (branchId && branchId !== "ALL") params.set("branchId", branchId);
        if (query) params.set("query", query);
        if (minStock) params.set("minStock", minStock);
        if (maxStock) params.set("maxStock", maxStock);
        if (dateFrom) params.set("dateFrom", dateFrom);

        replace(`${pathname}?${params.toString()}`);
    };

    // --- ACCIÓN: LIMPIAR TODO ---
    const clearFilters = () => {
        // 1. Reseteamos estados visuales
        setQuery("");
        setMinStock("");
        setMaxStock("");
        setDateFrom("");
        
        // Si es restringido, no le quitamos su sucursal
        if (!isRestricted) {
            setBranchId("");
        } else if (userBranchId) {
            setBranchId(userBranchId.toString());
        }

        // 2. Reseteamos URL
        const params = new URLSearchParams();
        if (isRestricted && userBranchId) {
            params.set("branchId", userBranchId.toString());
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-700">Filtros Avanzados</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* 1. SUCURSAL */}
                <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Sucursal</Label>
                    <div className="relative">
                        <Select 
                            value={branchId}
                            onValueChange={setBranchId}
                            disabled={isRestricted} 
                        >
                            <SelectTrigger className={cn("h-8 text-xs bg-gray-50", isRestricted && "opacity-80 bg-gray-100")}>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas las sedes</SelectItem>
                                {branches.map(b => (
                                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {isRestricted && <Lock className="w-3 h-3 text-gray-400 absolute right-8 top-2.5" />}
                    </div>
                </div>

                {/* 2. PRODUCTO (COMBOBOX) */}
                <div className="space-y-1 lg:col-span-1">
                    <Label className="text-xs text-gray-500">Producto</Label>
                    <Popover open={openProduct} onOpenChange={setOpenProduct}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openProduct}
                                className="w-full h-8 justify-between text-xs bg-gray-50 font-normal px-3 truncate"
                            >
                                {query || "Buscar producto..."}
                                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                            <Command>
                                <CommandInput placeholder="Escribe nombre o código..." className="h-8 text-xs" />
                                <CommandList>
                                    <CommandEmpty>No encontrado.</CommandEmpty>
                                    <CommandGroup>
                                        {products.slice(0, 50).map((product) => (
                                            <CommandItem
                                                key={product.id}
                                                value={product.name} // Se usa para filtrar dentro del command
                                                onSelect={(currentValue) => {
                                                    setQuery(product.name); // Guardamos el nombre en el estado local
                                                    setOpenProduct(false);
                                                }}
                                                className="text-xs"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-3 w-3",
                                                        query === product.name ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span>{product.name}</span>
                                                    <span className="text-[10px] text-gray-400">{product.code}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* 3. STOCK */}
                <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Stock (Mín - Máx)</Label>
                    <div className="flex gap-1">
                        <Input 
                            type="number" placeholder="Min" className="h-8 text-xs bg-gray-50"
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value)}
                        />
                        <Input 
                            type="number" placeholder="Max" className="h-8 text-xs bg-gray-50"
                            value={maxStock}
                            onChange={(e) => setMaxStock(e.target.value)}
                        />
                    </div>
                </div>

                {/* 4. FECHA */}
                <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Actualizado desde</Label>
                    <div className="relative">
                        <Input 
                            type="date" 
                            className="h-8 text-xs bg-gray-50 pl-7"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                        <Calendar className="w-3 h-3 text-gray-400 absolute left-2 top-2.5" />
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex items-end gap-2">
                    <Button 
                        size="sm" 
                        onClick={applyFilters}
                        className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Filter className="w-3.5 h-3.5 mr-2" /> Aplicar
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearFilters}
                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 px-3"
                        title="Limpiar filtros"
                    >
                        <FilterX className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}