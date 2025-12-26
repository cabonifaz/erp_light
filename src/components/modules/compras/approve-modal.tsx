'use client'

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, FileText, Download, Loader2 } from "lucide-react";
import { approveRequestWithDetails, getRequestDetails, Quotation } from "@/actions/purchase-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ApproveModalProps {
    requestId: number;
    requestDesc: string;
}

export function ApproveModal({ requestId, requestDesc }: ApproveModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    
    // Estado del formulario
    const [comment, setComment] = useState("");
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

    // Cargar cotizaciones al abrir
    const handleOpenChange = async (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            setFetching(true);
            const data = await getRequestDetails(requestId);
            setQuotations(data.quotations);
            setFetching(false);
        }
    };

    const handleApprove = async () => {
        setLoading(true);
        const res = await approveRequestWithDetails(requestId, comment, selectedQuoteId);
        setLoading(false);

        if (res.success) {
            toast.success(res.message);
            setOpen(false);
        } else {
            toast.error(res.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar
                </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Aprobar Solicitud #{requestId}</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1 italic">"{requestDesc}"</p>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    
                    {/* SECCIÓN 1: COTIZACIONES */}
                    <div className="space-y-3">
                        <Label className="font-semibold text-gray-700">1. Revisar Cotizaciones Adjuntas</Label>
                        
                        {fetching ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400"/></div>
                        ) : quotations.length === 0 ? (
                            <p className="text-sm text-gray-400 bg-gray-50 p-3 rounded-md border border-dashed text-center">
                                No hay archivos adjuntos en esta solicitud.
                            </p>
                        ) : (
                            <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                                {quotations.map((q) => (
                                    <div 
                                        key={q.id} 
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                            selectedQuoteId === q.id 
                                                ? "border-green-500 bg-green-50 ring-1 ring-green-500" 
                                                : "border-gray-200 hover:bg-gray-50"
                                        )}
                                        onClick={() => setSelectedQuoteId(q.id)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {/* Checkbox visual para indicar selección */}
                                            <div className={cn(
                                                "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                                                selectedQuoteId === q.id ? "border-green-600 bg-green-600" : "border-gray-400"
                                            )}>
                                                {selectedQuoteId === q.id && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                            
                                            <div className="flex flex-col truncate">
                                                <span className="text-sm font-medium text-gray-700 truncate">{q.file_name}</span>
                                                <a 
                                                    href={q.file_path} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="text-[10px] text-blue-500 hover:underline flex items-center gap-1"
                                                    onClick={(e) => e.stopPropagation()} // Para que no active el select al dar click en ver
                                                >
                                                    <Download className="w-3 h-3" /> Descargar/Ver
                                                </a>
                                            </div>
                                        </div>

                                        {selectedQuoteId === q.id && (
                                            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                ELEGIDA
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-[10px] text-gray-500">
                            * Seleccione la cotización ganadora haciendo click sobre ella (opcional).
                        </p>
                    </div>

                    {/* SECCIÓN 2: COMENTARIO */}
                    <div className="space-y-2">
                        <Label className="font-semibold text-gray-700">2. Comentario de Aprobación</Label>
                        <Textarea 
                            placeholder="Ej: Se aprueba procediendo con el proveedor X debido a mejor tiempo de entrega..." 
                            className="resize-none h-24"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleApprove} 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={loading}
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirmar Aprobación
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}