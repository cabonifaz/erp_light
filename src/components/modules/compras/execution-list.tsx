'use client'

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Trash2, FileText, CreditCard, MessageSquare, Building2 } from "lucide-react";
import { validateDocument, deleteDocument } from "@/actions/purchase-actions";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ExecutionListProps {
    invoices: any[]; // Data que viene de getExecutionDetails
    isValidator: boolean; // True si el usuario tiene permisos para validar
}

export function ExecutionList({ invoices, isValidator }: ExecutionListProps) {
    const [processing, setProcessing] = useState<number | null>(null);

    const handleValidate = async (type: 'INVOICE' | 'VOUCHER', id: number, status: 'VALIDADO' | 'RECHAZADO', observation: string = "") => {
        setProcessing(id);
        const res = await validateDocument(type, id, status, observation);
        setProcessing(null);
        if(res.success) toast.success(res.message);
        else toast.error(res.message);
    };

    const handleDelete = async (type: 'INVOICE' | 'VOUCHER', id: number) => {
        if(!confirm("¿Estás seguro de eliminar este documento? Tendrás que subirlo de nuevo.")) return;
        setProcessing(id);
        const res = await deleteDocument(type, id);
        setProcessing(null);
        if(res.success) toast.success(res.message);
        else toast.error(res.message);
    };

    if (invoices.length === 0) return <div className="text-center py-4 text-gray-400 text-xs italic">No hay documentos registrados aún.</div>;

    return (
        <div className="space-y-4">
            {invoices.map((inv) => (
                <div key={`inv-${inv.id}`} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                    {/* --- HEADER FACTURA --- */}
                    <div className="bg-gray-50 p-3 border-b flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1.5 rounded">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{inv.invoice_number}</p>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                        <Building2 className="w-3 h-3" />
                                        <span className="truncate max-w-[150px]">{inv.provider_name || 'Proveedor'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <StatusBadge status={inv.status} />
                                
                                {/* Botón Descargar PDF */}
                                <a href={inv.invoice_path} target="_blank" className="text-[10px] text-blue-600 hover:underline border px-2 py-0.5 rounded bg-white">
                                    PDF
                                </a>

                                {/* Control de Validación Factura */}
                                {isValidator && inv.status === 'PENDIENTE' && (
                                    <ValidationControls 
                                        onValidate={(status, obs) => handleValidate('INVOICE', inv.id, status, obs)} 
                                        isLoading={processing === inv.id}
                                    />
                                )}
                                {/* Eliminar si está rechazado o pendiente */}
                                {!isValidator && inv.status !== 'VALIDADO' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete('INVOICE', inv.id)} className="h-6 w-6 text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Observación Factura */}
                    {inv.observation && (
                        <div className="bg-red-50 p-2 text-xs text-red-700 border-b flex gap-2">
                            <MessageSquare className="w-3 h-3 mt-0.5" />
                            <span><strong>Obs:</strong> {inv.observation}</span>
                        </div>
                    )}

                    {/* --- LISTA VOUCHERS --- */}
                    <div className="p-3 bg-white space-y-2">
                        {inv.vouchers.length === 0 ? (
                            <p className="text-[10px] text-gray-400 italic pl-2">Sin vouchers asociados.</p>
                        ) : (
                            inv.vouchers.map((v: any) => (
                                <div key={`vou-${v.id}`} className="flex items-center justify-between p-2 border rounded-md bg-gray-50/50">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="w-4 h-4 text-green-600" />
                                        <div>
                                            <p className="text-xs font-semibold text-gray-700">Op: {v.voucher_number}</p>
                                            <div className="flex gap-2 text-[10px] text-gray-500">
                                                <span>{new Date(v.payment_date).toLocaleDateString()}</span>
                                                <a href={v.payment_proof_path} target="_blank" className="text-blue-500 hover:underline">Ver Foto</a>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col items-end gap-1">
                                            <StatusBadge status={v.status} />
                                            {v.observation && <span className="text-[10px] text-red-500 max-w-[100px] truncate text-right" title={v.observation}>{v.observation}</span>}
                                        </div>

                                        {/* Control Validación Voucher */}
                                        {isValidator && v.status === 'PENDIENTE' && (
                                            <ValidationControls 
                                                onValidate={(status, obs) => handleValidate('VOUCHER', v.id, status, obs)} 
                                                isLoading={processing === v.id}
                                            />
                                        )}
                                        
                                         {/* Eliminar Voucher */}
                                        {!isValidator && v.status !== 'VALIDADO' && (
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete('VOUCHER', v.id)} className="h-6 w-6 text-gray-400 hover:text-red-500">
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// Subcomponente de Badge
function StatusBadge({ status }: { status: string }) {
    if (status === 'VALIDADO') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px] shadow-none">Validado</Badge>;
    if (status === 'RECHAZADO') return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-[10px] shadow-none">Rechazado</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200 text-[10px] shadow-none">Pendiente</Badge>;
}

// Subcomponente de Controles de Validación (Check / X con Popover para observación)
function ValidationControls({ onValidate, isLoading }: { onValidate: (s: any, o: string) => void, isLoading: boolean }) {
    const [obs, setObs] = useState("");

    return (
        <div className="flex items-center gap-1 bg-white border rounded-md p-0.5 shadow-sm">
            <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600 hover:bg-green-50 rounded-sm" disabled={isLoading} onClick={() => onValidate('VALIDADO', '')} title="Aprobar">
                <Check className="w-4 h-4" />
            </Button>
            
            <Popover>
                <PopoverTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600 hover:bg-red-50 rounded-sm" disabled={isLoading} title="Rechazar">
                        <X className="w-4 h-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" side="left">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Motivo del rechazo:</Label>
                        <Input 
                            value={obs} 
                            onChange={(e) => setObs(e.target.value)} 
                            className="h-8 text-xs" 
                            placeholder="Ej: Voucher ilegible..."
                            autoFocus
                        />
                        <Button size="sm" className="w-full h-7 text-xs bg-red-600 hover:bg-red-700" onClick={() => onValidate('RECHAZADO', obs)}>
                            Confirmar Rechazo
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}