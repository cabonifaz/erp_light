'use client'

import { useState, useEffect } from "react";
// Importamos useSession para validar roles en el cliente
import { useSession } from "next-auth/react"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, PackageOpen, Search, Loader2, Plus, FileUp, Receipt, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { registerReception, getProductsSearch, getRequestInvoices, getUnitMeasures } from "@/actions/purchase-actions";

// Importamos el Modal de Creación
import { CreateProductDialog } from "@/components/modules/productos/create-product-dialog";

interface RegisterReceptionDialogProps {
    requestId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function RegisterReceptionDialog({ requestId, open, onOpenChange, onSuccess }: RegisterReceptionDialogProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    
    // Estados Modales
    const [showCreateProduct, setShowCreateProduct] = useState(false);

    // Datos Cabecera
    const [guideNumber, setGuideNumber] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState("");
    const [invoicesList, setInvoicesList] = useState<{id: number, invoice_number: string}[]>([]); 
    const [unitsList, setUnitsList] = useState<{code: string, description: string}[]>([]); 

    // Items
    const [items, setItems] = useState<{product_id: number, product_name: string, quantity: number, unit_measure: string}[]>([]);
    
    // Buscador
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Inputs detalle
    const [qtyInput, setQtyInput] = useState(1);
    const [uomInput, setUomInput] = useState("UND"); 

    // --- PERMISOS: ¿Quién puede crear productos? ---
    const userRole = session?.user?.role?.toUpperCase() || "";
    const canCreateProduct = ['LOGISTICA', 'ADMINISTRADOR GENERAL', 'CEO'].includes(userRole);

    // Carga inicial
    useEffect(() => {
        if (open && requestId) {
            Promise.all([getRequestInvoices(requestId), getUnitMeasures()])
                .then(([inv, units]) => {
                    setInvoicesList(inv);
                    setUnitsList(units);
                });
        }
    }, [open, requestId]);

    // Buscador
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length > 1) {
                setIsSearching(true);
                const results = await getProductsSearch(searchTerm);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleAddItem = (product: any) => {
        if (items.find(i => i.product_id === product.id)) {
            toast.error("Producto ya listado.");
            return;
        }
        // Agregamos con la unidad del producto si existe, o la seleccionada
        const finalUom = product.unit_measure || uomInput;
        
        setItems([...items, { 
            product_id: product.id, 
            product_name: product.name, 
            quantity: qtyInput,
            unit_measure: finalUom 
        }]);
        
        // Reset inputs
        setSearchTerm("");
        setSearchResults([]);
        setQtyInput(1);
        setUomInput("UND"); 
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleSubmit = async () => {
        // 1. Validaciones básicas
        if (!selectedInvoice) return toast.error("Selecciona una Factura.");
        if (items.length === 0) return toast.error("La lista de productos está vacía.");

        // 2. Validación de coherencia (Opcional): Si subes archivo, pedimos número para orden.
        if (file && !guideNumber) {
            return toast.error("Si adjuntas un documento, ingresa el N° de Guía para identificarlo.");
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("request_id", requestId.toString());
        formData.append("invoice_id", selectedInvoice);
        
        // Enviamos vacíos si no existen (Backend debe estar preparado para recibir null/empty)
        formData.append("guide_number", guideNumber || "");
        if (file) {
            formData.append("file_guide", file);
        }
        
        formData.append("items_json", JSON.stringify(items));

        const res = await registerReception(formData);
        setLoading(false);

        if (res.success) {
            toast.success(res.message);
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } else {
            toast.error(res.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-700">
                        <PackageOpen className="w-5 h-5" /> Ingreso de Mercadería
                    </DialogTitle>
                    <DialogDescription>
                        Registra la recepción física de productos.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* FACTURA */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-500">Factura Relacionada *</Label>
                        <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                                {invoicesList.length > 0 ? invoicesList.map(i => <SelectItem key={i.id} value={i.id.toString()}>{i.invoice_number}</SelectItem>) : <div className="p-2 text-xs text-gray-400">Sin facturas</div>}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* GUÍA Y ARCHIVO (OPCIONALES) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-500">N° Guía (Opcional)</Label>
                            <Input 
                                value={guideNumber} 
                                onChange={e => setGuideNumber(e.target.value)} 
                                className="h-9" 
                                placeholder="Ej: T001-45..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-gray-500">Documento (Opcional)</Label>
                            <Input 
                                type="file" 
                                onChange={e => setFile(e.target.files?.[0] || null)} 
                                className="h-9 text-xs" 
                            />
                        </div>
                    </div>

                    {/* SECCIÓN PRODUCTOS CON BOTÓN CREAR */}
                    <div className="border border-blue-100 bg-blue-50/50 p-4 rounded-md space-y-3 relative">
                        <div className="flex justify-between items-center">
                            <Label className="text-xs font-bold uppercase text-blue-600 flex items-center gap-1">
                                <Search className="w-3 h-3" /> Agregar Productos
                            </Label>
                            
                            {/* BOTÓN CREAR PRODUCTO (SOLO ROLES AUTORIZADOS) */}
                            {canCreateProduct && (
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 text-xs text-blue-700 hover:bg-blue-100 px-2"
                                    onClick={() => setShowCreateProduct(true)}
                                >
                                    <PackagePlus className="w-3 h-3 mr-1" /> Crear Nuevo
                                </Button>
                            )}
                        </div>
                        
                        <div className="flex gap-2 items-end">
                            <div className="relative flex-1">
                                <Input 
                                    className="bg-white h-9 pl-8" placeholder="Buscar..." 
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
                                />
                                {isSearching ? <Loader2 className="absolute left-2 top-2.5 h-4 w-4 animate-spin text-blue-500" /> : <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />}
                                
                                {searchResults.length > 0 && (
                                    <div className="absolute top-10 left-0 w-full bg-white border rounded-md shadow-xl z-50 max-h-48 overflow-y-auto">
                                        {searchResults.map(prod => (
                                            <div key={prod.id} className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b flex justify-between group" onClick={() => handleAddItem(prod)}>
                                                <div>
                                                    <div className="font-medium text-gray-800">{prod.name}</div>
                                                    <div className="text-[10px] text-gray-400">{prod.code}</div>
                                                </div>
                                                <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-600" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-20">
                                <Input type="number" className="bg-white h-9 text-right" value={qtyInput} onChange={e => setQtyInput(Number(e.target.value))} />
                            </div>
                            <div className="w-28">
                                <Select value={uomInput} onValueChange={setUomInput}>
                                    <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {unitsList.length > 0 ? unitsList.map(u => <SelectItem key={u.code} value={u.code}>{u.description}</SelectItem>) : <SelectItem value="UND">Unidades</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1 mt-2 max-h-40 overflow-y-auto pr-1">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border text-sm shadow-sm">
                                    <div className="flex flex-col flex-1 mr-2">
                                        <span className="truncate font-medium text-gray-700">{item.product_name}</span>
                                        <span className="text-[10px] text-gray-400">{item.quantity} {item.unit_measure}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-50" onClick={() => handleRemoveItem(idx)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                            ))}
                            {items.length === 0 && <div className="text-center py-4 text-gray-400 text-xs border-2 border-dashed rounded-md bg-white">Lista vacía</div>}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading || items.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <FileUp className="w-4 h-4 mr-2" />} Registrar
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* MODAL ANIDADO: CREAR PRODUCTO */}
            <CreateProductDialog 
                open={showCreateProduct} 
                onOpenChange={setShowCreateProduct} 
                onProductCreated={(newProd) => {
                    // AUTO-SELECCIONAR EL PRODUCTO CREADO
                    handleAddItem(newProd);
                    toast.success(`Producto "${newProd.name}" agregado a la lista.`);
                }}
            />
        </Dialog>
    );
}