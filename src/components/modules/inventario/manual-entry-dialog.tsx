'use client'

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Search, ArrowRightLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { registerManualAdjustment } from "@/actions/inventory-actions";
import { getProductsSearch } from "@/actions/purchase-actions"; 

interface ManualEntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branches: { id: number; name: string }[];
    userRole: string;     
    userBranchId: number; 
}

export function ManualEntryDialog({ open, onOpenChange, branches, userRole, userBranchId }: ManualEntryDialogProps) {
    const [loading, setLoading] = useState(false);
    
    // 1. Definir roles privilegiados (pueden cambiar de sucursal)
    const PRIVILEGED_ROLES = ['CEO', 'LOGISTICA', 'ADMINISTRADOR GENERAL'];
    const canChangeBranch = PRIVILEGED_ROLES.includes(userRole);

    // 2. Estados del Formulario
    const [branchId, setBranchId] = useState("");
    const [type, setType] = useState("INGRESO"); 
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState("");
    
    // 3. Estados del Buscador
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // 4. EFECTO DE INICIALIZACIÓN (Clave para la sucursal automática)
    // 4. EFECTO DE INICIALIZACIÓN
    useEffect(() => {
        if (open) {
            // Resetear campos
            setReason("");
            setQuantity(1);
            setSearchTerm("");
            setSelectedProduct(null);
            setType("INGRESO");

            // LÓGICA MEJORADA:
            // Si el usuario tiene una sucursal (sea Jefe o Almacenero), la pre-seleccionamos.
            if (userBranchId && userBranchId > 0) {
                setBranchId(userBranchId.toString());
            } else {
                setBranchId(""); // Si no tiene sucursal (ej. Admin Global sin sede), inicia vacío.
            }
        }
    }, [open, userBranchId]); // Quitamos 'canChangeBranch' de las dependencias para simplificar

    // 5. Lógica del Buscador (Debounce)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.length > 1) {
                setIsSearching(true);
                const results = await getProductsSearch(searchTerm);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSelectProduct = (prod: any) => {
        setSelectedProduct(prod);
        setSearchTerm(prod.name);
        setSearchResults([]); 
    };

    const handleSubmit = async () => {
        // Validaciones
        if (!branchId) {
            toast.error("La sucursal es obligatoria.");
            return;
        }
        if (!selectedProduct) {
            toast.error("Debes buscar y seleccionar un producto.");
            return;
        }
        if (quantity <= 0) {
            toast.error("La cantidad debe ser mayor a 0.");
            return;
        }
        if (!reason.trim()) {
            toast.error("Debes indicar un motivo.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("branch_id", branchId);
        formData.append("product_id", selectedProduct.id.toString());
        formData.append("quantity", quantity.toString());
        formData.append("type", type);
        formData.append("reason", reason);

        const res = await registerManualAdjustment(formData);
        setLoading(false);

        if (res.success) {
            toast.success(res.message);
            onOpenChange(false);
        } else {
            toast.error(res.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-gray-800">
                        <ArrowRightLeft className="w-5 h-5" /> Ajuste Manual de Stock
                    </DialogTitle>
                    <DialogDescription>
                        {canChangeBranch 
                            ? "Selecciona la sucursal y registra el movimiento."
                            : "Registrando movimiento en tu sucursal asignada."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Fila 1: Sucursal y Tipo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Sucursal</Label>
                            <div className="relative">
                                <Select 
                                    value={branchId} 
                                    onValueChange={setBranchId} 
                                    disabled={!canChangeBranch} // Bloqueado si no es jefe
                                >
                                    <SelectTrigger className={!canChangeBranch ? "bg-gray-100 text-gray-600 font-medium opacity-100" : ""}>
                                        <SelectValue placeholder={!canChangeBranch && !branchId ? "Sin Asignar" : "Seleccionar"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!canChangeBranch && (
                                    <Lock className="w-3 h-3 text-gray-400 absolute right-8 top-3" />
                                )}
                            </div>
                            {!canChangeBranch && !branchId && (
                                <p className="text-[10px] text-red-500 mt-1 font-medium">⚠ Tu usuario no tiene sucursal.</p>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Tipo Movimiento</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className={type === 'INGRESO' ? "border-blue-200 bg-blue-50 text-blue-700" : "border-red-200 bg-red-50 text-red-700"}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INGRESO">🔵 Ingreso / Carga</SelectItem>
                                    <SelectItem value="SALIDA">🔴 Salida / Merma</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Fila 2: Buscador Producto */}
                    <div className="space-y-2 relative">
                        <Label>Producto</Label>
                        <div className="relative">
                            <Input 
                                placeholder="Buscar por nombre o código..." 
                                value={searchTerm} 
                                onChange={e => { setSearchTerm(e.target.value); if(!e.target.value) setSelectedProduct(null); }}
                                className={selectedProduct ? "border-green-500 bg-green-50 text-green-700 font-medium pl-8" : "pl-8"}
                            />
                            {isSearching ? (
                                <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                            ) : (
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            )}
                        </div>
                        
                        {/* Resultados del buscador */}
                        {searchResults.length > 0 && !selectedProduct && (
                            <div className="absolute top-full left-0 w-full bg-white border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto mt-1">
                                {searchResults.map(prod => (
                                    <div 
                                        key={prod.id} 
                                        className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0"
                                        onClick={() => handleSelectProduct(prod)}
                                    >
                                        <div className="font-bold text-gray-700">{prod.name}</div>
                                        <div className="text-xs text-gray-400 flex justify-between">
                                            <span>{prod.code}</span>
                                            <span>{prod.unit_measure}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Fila 3: Cantidad */}
                    <div className="space-y-2">
                        <Label>Cantidad ({selectedProduct?.unit_measure || 'UND'})</Label>
                        <Input 
                            type="number" 
                            min="0.01" 
                            step="0.01" 
                            value={quantity} 
                            onChange={e => setQuantity(parseFloat(e.target.value))} 
                        />
                    </div>

                    {/* Fila 4: Motivo */}
                    <div className="space-y-2">
                        <Label>Motivo / Observación</Label>
                        <Textarea 
                            placeholder="Ej: Conteo cíclico, merma por rotura, carga inicial..." 
                            value={reason} 
                            onChange={e => setReason(e.target.value)} 
                            className="resize-none h-20"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading} className={type === 'INGRESO' ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}>
                        {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Save className="mr-2 w-4 h-4" />}
                        {type === 'INGRESO' ? 'Registrar Ingreso' : 'Registrar Salida'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}