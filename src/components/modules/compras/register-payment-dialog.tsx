'use client'

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, CreditCard, Hash, Upload, X, Building2, MapPin, CheckCircle2, ExternalLink } from "lucide-react";
import { registerPurchasePaymentComplex } from "@/actions/purchase-actions";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RegisterPaymentDialogProps {
    requestId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    existingData?: any[]; // Recibe los datos de BD
}

type VoucherItem = {
    tempId: string;
    number: string;
    date: string;
    file: File | null;
    existingUrl?: string; 
};

type InvoiceItem = {
    tempId: string;
    providerRuc: string;    
    providerName: string;   
    providerBranch: string; 
    number: string;
    file: File | null;
    existingUrl?: string; 
    vouchers: VoucherItem[];
};

export function RegisterPaymentDialog({ requestId, open, onOpenChange, onSuccess, existingData = [] }: RegisterPaymentDialogProps) {
    const [loading, setLoading] = useState(false);
    
    // Estado inicial
    const [invoices, setInvoices] = useState<InvoiceItem[]>([
        { tempId: '1', providerRuc: '', providerName: '', providerBranch: '', number: '', file: null, vouchers: [] }
    ]);

    // --- EFECTO: CARGAR DATOS EXISTENTES AL ABRIR ---
    useEffect(() => {
        if (open && existingData && existingData.length > 0) {
            console.log("Cargando datos en modal:", existingData); // Debug

            try {
                const mappedInvoices: InvoiceItem[] = existingData.map((dbInv, index) => ({
                    tempId: `db-${dbInv.id}`,
                    providerRuc: dbInv.provider_ruc || '',
                    providerName: dbInv.provider_name || '',
                    providerBranch: '', 
                    number: dbInv.invoice_number || '',
                    file: null, 
                    existingUrl: dbInv.invoice_path || '',
                    vouchers: (dbInv.vouchers || []).map((v: any) => {
                        // FIX: Manejo seguro de fechas
                        let dateStr = '';
                        if (v.payment_date) {
                            try {
                                dateStr = new Date(v.payment_date).toISOString().split('T')[0];
                            } catch (e) { dateStr = ''; }
                        }

                        return {
                            tempId: `db-v-${v.id}`,
                            number: v.voucher_number || '',
                            date: dateStr,
                            file: null,
                            existingUrl: v.payment_proof_path || ''
                        };
                    })
                }));
                setInvoices(mappedInvoices);
            } catch (error) {
                console.error("Error al mapear datos:", error);
                // Si falla el mapeo, mostramos formulario vacío para no bloquear
                setInvoices([{ tempId: '1', providerRuc: '', providerName: '', providerBranch: '', number: '', file: null, vouchers: [] }]);
            }

        } else if (open && (!existingData || existingData.length === 0)) {
            // Resetear si no hay datos
            setInvoices([{ tempId: '1', providerRuc: '', providerName: '', providerBranch: '', number: '', file: null, vouchers: [] }]);
        }
    }, [open, existingData]);

    // --- FUNCIONES DE GESTIÓN ---
    const addInvoice = () => {
        setInvoices([...invoices, { tempId: Date.now().toString(), providerRuc: '', providerName: '', providerBranch: '', number: '', file: null, vouchers: [] }]);
    };
    const removeInvoice = (index: number) => {
        const newInv = [...invoices];
        newInv.splice(index, 1);
        setInvoices(newInv);
    };
    const updateInvoice = (index: number, field: keyof InvoiceItem, value: any) => {
        const newInv = [...invoices];
        // @ts-ignore
        newInv[index][field] = value;
        setInvoices(newInv);
    };
    const addVoucher = (invoiceIndex: number) => {
        const newInv = [...invoices];
        newInv[invoiceIndex].vouchers.push({ tempId: Date.now().toString(), number: '', date: new Date().toISOString().split('T')[0], file: null });
        setInvoices(newInv);
    };
    const removeVoucher = (invoiceIndex: number, voucherIndex: number) => {
        const newInv = [...invoices];
        newInv[invoiceIndex].vouchers.splice(voucherIndex, 1);
        setInvoices(newInv);
    };
    const updateVoucher = (invoiceIndex: number, voucherIndex: number, field: keyof VoucherItem, value: any) => {
        const newInv = [...invoices];
        // @ts-ignore
        newInv[invoiceIndex].vouchers[voucherIndex][field] = value;
        setInvoices(newInv);
    };

    const handleSubmit = async () => {
        // Validaciones básicas antes de enviar
        if (invoices.length === 0) return toast.error("Debes agregar al menos una factura.");
        
        for (const inv of invoices) {
            if (!inv.providerRuc || inv.providerRuc.length < 8) return toast.error(`RUC inválido en factura ${inv.number || '#'}.`);
            if (!inv.providerName) return toast.error(`Falta Razón Social en factura ${inv.number || '#'}.`);
            if (!inv.number) return toast.error("Falta número de factura.");
            // Si NO tiene URL existente Y NO tiene archivo nuevo -> Error
            if (!inv.file && !inv.existingUrl) return toast.error(`Falta archivo en factura ${inv.number}.`);
            
            if (inv.vouchers.length === 0) return toast.error(`La factura ${inv.number} no tiene pagos.`);

            for (const v of inv.vouchers) {
                if (!v.number) return toast.error(`Falta número en un voucher.`);
                if (!v.file && !v.existingUrl) return toast.error(`Falta archivo en voucher ${v.number}.`);
            }
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("request_id", requestId.toString());
        
        const dataPayload = invoices.map(inv => ({
            tempId: inv.tempId,
            providerRuc: inv.providerRuc,
            providerName: inv.providerName,
            providerBranch: inv.providerBranch,
            number: inv.number,
            vouchers: inv.vouchers.map(v => ({
                tempId: v.tempId,
                number: v.number,
                date: v.date
            }))
        }));
        formData.append("data", JSON.stringify(dataPayload));

        invoices.forEach(inv => {
            if (inv.file) formData.append(`file_invoice_${inv.tempId}`, inv.file);
            inv.vouchers.forEach(v => {
                if (v.file) formData.append(`file_voucher_${inv.tempId}_${v.tempId}`, v.file);
            });
        });

        const res = await registerPurchasePaymentComplex(formData);
        setLoading(false);
        if (res.success) {
            toast.success("Éxito", { description: res.message });
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } else {
            toast.error("Error", { description: res.message });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b bg-gray-50/50 flex-shrink-0">
                    <DialogTitle className="text-xl">Gestión de Facturación y Pagos</DialogTitle>
                    <DialogDescription>
                        Visualiza y edita los documentos registrados o agrega nuevos pagos.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-hidden relative bg-gray-50/30">
                    <ScrollArea className="h-full w-full">
                        <div className="p-6 space-y-8">
                            {invoices.map((inv, i) => (
                                <div key={inv.tempId} className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                                    <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">{i + 1}</div>
                                            <h3 className="font-semibold text-blue-900">Documento de Compra</h3>
                                        </div>
                                        {/* Solo permitimos eliminar si es un registro NUEVO (no viene de BD) */}
                                        {!inv.existingUrl && (
                                            <Button variant="ghost" size="sm" onClick={() => removeInvoice(i)} className="text-red-500 hover:bg-red-50 hover:text-red-700">
                                                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                            </Button>
                                        )}
                                    </div>

                                    <div className="p-5 space-y-6">
                                        {/* PROVEEDOR */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                                            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                                                <Building2 className="w-4 h-4 text-blue-500" /> Datos del Proveedor
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                <div className="md:col-span-3 space-y-1">
                                                    <Label className="text-xs font-medium text-gray-500">RUC</Label>
                                                    <Input placeholder="20..." value={inv.providerRuc} onChange={(e) => updateInvoice(i, 'providerRuc', e.target.value)} maxLength={11} className="bg-white h-9 text-sm" disabled={!!inv.existingUrl}/>
                                                </div>
                                                <div className="md:col-span-5 space-y-1">
                                                    <Label className="text-xs font-medium text-gray-500">Razón Social</Label>
                                                    <Input placeholder="Razón Social" value={inv.providerName} onChange={(e) => updateInvoice(i, 'providerName', e.target.value)} className="bg-white h-9 text-sm" disabled={!!inv.existingUrl}/>
                                                </div>
                                                <div className="md:col-span-4 space-y-1">
                                                    <Label className="text-xs font-medium text-gray-500 flex gap-1"><MapPin className="w-3 h-3"/> Sucursal</Label>
                                                    <Input placeholder="Opcional" value={inv.providerBranch} onChange={(e) => updateInvoice(i, 'providerBranch', e.target.value)} className="bg-white h-9 text-sm" disabled={!!inv.existingUrl}/>
                                                </div>
                                            </div>
                                        </div>

                                        {/* FACTURA */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-gray-500 uppercase">N° Factura</Label>
                                                <div className="relative">
                                                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                    <Input placeholder="F001-00045" value={inv.number} onChange={(e) => updateInvoice(i, 'number', e.target.value)} className="pl-10 h-10 border-gray-300" disabled={!!inv.existingUrl}/>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-gray-500 uppercase">Archivo PDF / Imagen</Label>
                                                {inv.existingUrl ? (
                                                    <div className="flex items-center justify-between p-2 border rounded-md bg-green-50 border-green-200 h-10">
                                                        <div className="flex items-center gap-2 text-green-700 text-xs font-medium">
                                                            <CheckCircle2 className="w-4 h-4" /> Factura Guardada
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <a href={inv.existingUrl} target="_blank" className="p-1 hover:bg-green-100 rounded text-green-600" title="Ver"><ExternalLink className="w-4 h-4"/></a>
                                                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-blue-600 px-2" onClick={() => updateInvoice(i, 'existingUrl', undefined)}>Reemplazar</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <Upload className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                        <Input type="file" accept=".pdf,.jpg,.png" onChange={(e) => updateInvoice(i, 'file', e.target.files?.[0] || null)} className="pl-10 h-10 pt-1.5 cursor-pointer"/>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* VOUCHERS */}
                                        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-100/50">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700"><CreditCard className="w-4 h-4" /> Vouchers</div>
                                                <Button size="sm" variant="outline" onClick={() => addVoucher(i)} className="h-7 text-xs border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"><Plus className="w-3 h-3 mr-1" /> Agregar Pago</Button>
                                            </div>
                                            
                                            <div className="divide-y divide-gray-100 bg-white">
                                                {inv.vouchers.map((v, j) => (
                                                    <div key={v.tempId} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50/50">
                                                        <div className="col-span-3">
                                                            <Input placeholder="123456" value={v.number} onChange={(e) => updateVoucher(i, j, 'number', e.target.value)} className="h-8 text-xs border-gray-200" disabled={!!v.existingUrl}/>
                                                        </div>
                                                        <div className="col-span-3">
                                                            <Input type="date" value={v.date} onChange={(e) => updateVoucher(i, j, 'date', e.target.value)} className="h-8 text-xs border-gray-200" disabled={!!v.existingUrl}/>
                                                        </div>
                                                        <div className="col-span-5">
                                                            {v.existingUrl ? (
                                                                <div className="flex items-center justify-between bg-green-50 px-2 py-1 rounded border border-green-100 h-8">
                                                                    <span className="flex items-center gap-1 text-[10px] text-green-700 font-medium"><CheckCircle2 className="w-3 h-3" /> Voucher OK</span>
                                                                    <a href={v.existingUrl} target="_blank" className="text-green-600 hover:text-green-800"><ExternalLink className="w-3 h-3"/></a>
                                                                </div>
                                                            ) : (
                                                                <Input type="file" accept=".pdf,.jpg,.png" onChange={(e) => updateVoucher(i, j, 'file', e.target.files?.[0] || null)} className="h-8 text-[10px] border-gray-200 pt-1.5"/>
                                                            )}
                                                        </div>
                                                        <div className="col-span-1 flex justify-end">
                                                            {/* Solo permitir borrar si es nuevo (no viene de BD) */}
                                                            {!v.existingUrl && (
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-300 hover:text-red-500 rounded-full" onClick={() => removeVoucher(i, j)}><X className="w-4 h-4" /></Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {inv.vouchers.length === 0 && <div className="p-4 text-center text-gray-400 text-xs italic">Sin pagos agregados.</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <Button variant="outline" className="w-full border-dashed border-2 py-8 text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/10" onClick={addInvoice}><Plus className="w-5 h-5 mr-2" /> Registrar otra factura</Button>
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="p-6 border-t bg-white flex-shrink-0 z-10">
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-6 min-w-[150px]">
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : "Guardar Cambios"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}