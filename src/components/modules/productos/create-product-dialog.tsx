'use client'

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { createProduct } from "@/actions/product-actions";
import { getUnitMeasures } from "@/actions/purchase-actions";

interface CreateProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProductCreated?: (product: any) => void;
}

export function CreateProductDialog({ open, onOpenChange, onProductCreated }: CreateProductDialogProps) {
    const [loading, setLoading] = useState(false);
    const [units, setUnits] = useState<{code: string, description: string}[]>([]);
    
    // Form States (Sin 'code', ya que es automático)
    const [name, setName] = useState("");
    const [unit, setUnit] = useState("UND");
    const [desc, setDesc] = useState("");

    useEffect(() => {
        if(open) getUnitMeasures().then(setUnits);
    }, [open]);

    const handleSubmit = async () => {
        if (!name || !unit) {
            toast.error("El nombre y la unidad son obligatorios.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("name", name);
        formData.append("unit_measure", unit);
        formData.append("description", desc);
        // NO enviamos el código, el backend lo genera

        const res = await createProduct(formData);
        setLoading(false);

        if (res.success) {
            toast.success(res.message);
            onOpenChange(false);
            
            // Pasamos el producto nuevo al padre (con su ID y Código real)
            if (onProductCreated && res.product) {
                onProductCreated(res.product);
            }

            // Limpiar formulario
            setName("");
            setDesc("");
            setUnit("UND");
        } else {
            toast.error(res.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Z-Index 150 para que esté por encima del modal de Recepción */}
            <DialogContent className="sm:max-w-md z-[150]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-700">
                        <PackagePlus className="w-5 h-5" /> Nuevo Producto
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-gray-500 text-xs uppercase font-bold">Código</Label>
                            {/* Campo visual bloqueado indicando autogeneración */}
                            <div className="h-9 px-3 py-2 rounded-md border bg-gray-100 text-gray-500 text-sm font-mono flex items-center select-none">
                                PROD-######
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold">Unidad Medida *</Label>
                            <Select value={unit} onValueChange={setUnit}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                                {/* Z-Index 200 para que el combo flote sobre este modal */}
                                <SelectContent className="z-[200]">
                                    {units.map(u => (
                                        <SelectItem key={u.code} value={u.code}>
                                            {u.description} ({u.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold">Nombre del Producto *</Label>
                        <Input 
                            placeholder="Ej: Papel Bond A4 75gr" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-gray-500">Descripción</Label>
                        <Textarea 
                            placeholder="Detalles adicionales..." 
                            value={desc} 
                            onChange={e => setDesc(e.target.value)} 
                            className="resize-none h-20"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Save className="mr-2 w-4 h-4" />}
                        Guardar Producto
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}