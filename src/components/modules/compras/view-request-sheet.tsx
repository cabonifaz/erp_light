'use client'

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; 
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download, CheckCircle2, MapPin, User, Calendar, MessageSquare, AlertCircle, Plus, ShieldCheck, PackageOpen, XCircle, Truck, FileCheck } from "lucide-react";
// Importamos la nueva función getRequestReceptions
import { getRequestDetails, getExecutionDetails, completePurchaseRequest, validatePurchaseOrder, getRequestReceptions, Quotation } from "@/actions/purchase-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { RegisterPaymentDialog } from "./register-payment-dialog";
import { ExecutionList } from "./execution-list";
import { RegisterReceptionDialog } from "./register-reception-dialog"; 

interface ViewRequestSheetProps {
    request: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const formatDate = (dateVal: string | Date) => {
    if(!dateVal) return "-";
    const date = new Date(dateVal);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

// --- ERROR PERSONALIZADO ---
const showHighContrastError = (msg: string) => {
    toast.custom((t) => (
        <div 
            className="bg-red-600 border-2 border-red-800 rounded-lg shadow-2xl p-5 flex items-start gap-4 w-full max-w-md animate-in slide-in-from-top-2 relative" 
            role="alert"
        >
            <XCircle className="w-8 h-8 text-white shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex flex-col gap-1 pr-8">
                <h3 className="text-white font-bold text-lg leading-none">Error de Validación</h3>
                <p className="text-red-50 text-sm font-medium leading-relaxed">
                    {msg}
                </p>
            </div>
            <button 
                type="button" 
                onClick={() => toast.dismiss(t)} 
                className="absolute top-2 right-2 text-red-200 hover:text-white p-1 rounded-md hover:bg-red-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                title="Cerrar notificación"
            >
                <XCircle className="w-5 h-5" aria-hidden="true" />
                <span className="sr-only">Cerrar notificación</span>
            </button>
        </div>
    ), { duration: 8000 });
};

export function ViewRequestSheet({ request, open, onOpenChange }: ViewRequestSheetProps) {
    const { data: session } = useSession();
    
    // Estados
    const [currentRequest, setCurrentRequest] = useState(request);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [executionData, setExecutionData] = useState<any[]>([]); 
    const [receptions, setReceptions] = useState<any[]>([]); // Estado para las guías
    const [loading, setLoading] = useState(false);
    
    // Modales
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showReceptionDialog, setShowReceptionDialog] = useState(false);

    // Permisos
    const userRole = session?.user?.role ? session.user.role.toUpperCase().trim() : "";
    const status = currentRequest.status_code;

    const PRIVILEGED = ['CEO', 'LOGISTICA', 'ADMINISTRADOR GENERAL', 'CONTADOR', 'ADMIN'];
    const WAREHOUSE = ['ADMIN_SUC', 'ALMACEN', 'LOGISTICA', 'ADMINISTRADOR GENERAL', 'CEO']; // Agregamos CEO aquí también
    const ACCOUNTING = ['CEO', 'ADMINISTRADOR GENERAL', 'LOGISTICA', 'CONTADOR'];

    let canUploadPayments = false;
    if (status === 'VALIDADA') canUploadPayments = false;
    else if (status === 'APROBADO') canUploadPayments = true; 
    else if (['COMPLETADO', 'COMPRA REALIZADA'].includes(status)) canUploadPayments = PRIVILEGED.includes(userRole);

    const canCompletePurchase = status === 'APROBADO';
    const canReceiveGoods = WAREHOUSE.includes(userRole);
    const canValidatePurchase = ACCOUNTING.includes(userRole);

    // CARGAR TODO (INCLUYENDO RECEPCIONES)
    const loadAllData = () => {
        if (request?.id) {
            setLoading(true);
            Promise.all([
                getRequestDetails(request.id), 
                getExecutionDetails(request.id),
                getRequestReceptions(request.id) // <--- CARGAMOS LAS GUÍAS
            ])
            .then(([detailsData, execData, recepData]) => {
                setQuotations(detailsData.quotations || []);
                if (detailsData.request) setCurrentRequest((prev: any) => ({ ...prev, ...detailsData.request }));
                setExecutionData(execData); 
                setReceptions(recepData); // Guardamos en estado
            })
            .catch(err => console.error("Error cargando datos:", err))
            .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        setCurrentRequest(request);
        if (open) loadAllData();
    }, [open, request]);

    const handleCompletePayments = async () => {
        if(!confirm("¿Finalizar gestión de pagos?")) return;
        const res = await completePurchaseRequest(currentRequest.id);
        if(res.success) {
            toast.success(res.message);
            onOpenChange(false);
        } else {
            showHighContrastError(res.message);
        }
    };

    const handleValidateClose = async () => {
        if(!confirm("¿CONFIRMAS VALIDAR Y CERRAR LA COMPRA?")) return;
        const res = await validatePurchaseOrder(currentRequest.id);
        if(res.success) {
            toast.success(res.message);
            onOpenChange(false);
        } else {
            showHighContrastError(res.message);
        }
    };

    if (!currentRequest) return null;
    const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: currentRequest.currency || 'PEN' }).format(currentRequest.estimated_total);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto sm:max-w-md w-full p-0 bg-white">
                
                {/* CABECERA */}
                <div className={cn("px-6 py-6 border-b", 
                    status === 'VALIDADA' ? "bg-purple-50 border-purple-100" :
                    status === 'APROBADO' ? "bg-green-50 border-green-100" :
                    status === 'RECHAZADO' ? "bg-red-50 border-red-100" :
                    "bg-gray-50 border-gray-100"
                )}>
                    <SheetHeader>
                        <div className="flex justify-between items-start">
                            <Badge variant="outline" className="bg-white">REQ-{currentRequest.id.toString().padStart(6, '0')}</Badge>
                            <StatusBadge code={status} label={currentRequest.status_desc} />
                        </div>
                        <SheetTitle className="text-xl mt-2 font-bold">{money}</SheetTitle>
                        <SheetDescription className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" /> {formatDate(currentRequest.issue_date)}
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {/* BOTONES DE ACCIÓN */}
                {['APROBADO', 'COMPLETADO', 'COMPRA REALIZADA', 'VALIDADA'].includes(status) && (
                    <div className="px-6 py-4 bg-white border-b space-y-4">
                        
                        {/* 1. PAGOS */}
                        {(canUploadPayments || executionData.length > 0) && status !== 'VALIDADA' && (
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Gestión de Pagos</span>
                                    {canUploadPayments && (
                                        <Button size="sm" variant="outline" onClick={() => setShowPaymentDialog(true)} className="h-7 text-xs">
                                            <Plus className="w-3 h-3 mr-1" /> Registrar Doc.
                                        </Button>
                                    )}
                                </div>
                                {canCompletePurchase && executionData.length > 0 && (
                                    <Button size="sm" onClick={handleCompletePayments} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-2" /> Finalizar Pagos
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* 2. ALMACÉN */}
                        {canReceiveGoods && ['APROBADO', 'COMPLETADO', 'COMPRA REALIZADA'].includes(status) && (
                             <div className="pt-2 border-t mt-1">
                                <Button 
                                    variant="outline" 
                                    className="w-full border-dashed border-blue-400 text-blue-700 bg-blue-50 hover:bg-blue-100 h-10 font-semibold"
                                    onClick={() => setShowReceptionDialog(true)}
                                >
                                    <PackageOpen className="w-5 h-5 mr-2" />
                                    Registrar Guía / Recepción
                                </Button>
                             </div>
                        )}

                        {/* 3. CONTABILIDAD */}
                        {canValidatePurchase && ['COMPLETADO', 'COMPRA REALIZADA'].includes(status) && (
                            <div className="pt-2 border-t mt-1">
                                <Button className="w-full bg-purple-700 hover:bg-purple-800 text-white h-10 text-sm font-bold" onClick={handleValidateClose}>
                                    <ShieldCheck className="w-5 h-5 mr-2" /> VALIDAR Y CERRAR
                                </Button>
                            </div>
                        )}
                        
                        {/* AVISO DE CIERRE */}
                        {status === 'VALIDADA' && (
                            <div className="flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-800 border border-purple-200 rounded text-sm font-bold uppercase tracking-wide">
                                <ShieldCheck className="w-5 h-5" /> Expediente Cerrado y Validado
                            </div>
                        )}
                    </div>
                )}

                <div className="p-6 space-y-8 pb-24">
                    {/* INFO GENERAL */}
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><Label className="text-[10px] text-gray-500 uppercase">Sucursal</Label><div className="font-medium flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400"/>{currentRequest.branch_name}</div></div>
                            <div><Label className="text-[10px] text-gray-500 uppercase">Solicitante</Label><div className="font-medium flex items-center gap-1"><User className="w-3 h-3 text-gray-400"/>{currentRequest.requester_name}</div></div>
                        </div>
                        <div>
                            <Label className="text-[10px] text-gray-500 uppercase">Descripción</Label>
                            <div className="bg-gray-50 p-3 rounded border text-sm mt-1">{currentRequest.description}</div>
                        </div>
                    </div>

                    {/* --- NUEVA SECCIÓN: GUÍAS DE REMISIÓN --- */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                            <Truck className="w-4 h-4"/> Recepciones
                        </h3>
                        {receptions.length > 0 ? (
                            <div className="space-y-2">
                                {receptions.map((rec) => (
                                    <div key={rec.id} className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <FileCheck className="w-4 h-4 text-blue-600" />
                                                <span className="font-bold text-sm text-gray-800">Guía: {rec.document_number}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 flex flex-col sm:flex-row sm:gap-3">
                                                <span><User className="w-3 h-3 inline mr-1"/>{rec.user_name}</span>
                                                <span><Calendar className="w-3 h-3 inline mr-1"/>{new Date(rec.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="text-[10px] text-blue-600 font-medium bg-blue-100 w-fit px-2 py-0.5 rounded-full mt-1">
                                                {rec.items_count} items ingresados
                                            </div>
                                        </div>
                                        {rec.document_path && (
                                            <Button variant="ghost" size="icon" asChild title="Descargar Guía">
                                                <a href={rec.document_path} target="_blank" className="text-gray-400 hover:text-blue-600">
                                                    <Download className="w-5 h-5" />
                                                    <span className="sr-only">Descargar Guía</span>
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 border-2 border-dashed border-gray-100 rounded text-gray-400 text-xs">
                                No se han registrado guías aún.
                            </div>
                        )}
                    </div>

                    {/* FACTURAS */}
                    {(executionData.length > 0) && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b pb-2">Pagos</h3>
                            <div className="bg-gray-50 rounded-lg border p-1">
                                <ExecutionList invoices={executionData} isValidator={PRIVILEGED.includes(userRole)} />
                            </div>
                        </div>
                    )}

                    {/* COTIZACIONES */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b pb-2">Cotizaciones</h3>
                        <div className="space-y-2">
                             {quotations.map((q) => (
                                <div key={q.id} className={cn("flex justify-between items-center p-3 border rounded-lg", q.is_selected ? "bg-green-50 border-green-200" : "bg-white")}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm truncate">{q.file_name}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-400 hover:text-blue-600" title="Descargar Cotización">
                                        <a href={q.file_path} target="_blank">
                                            <Download className="w-4 h-4"/>
                                            <span className="sr-only">Descargar {q.file_name}</span>
                                        </a>
                                    </Button>
                                </div>
                             ))}
                        </div>
                    </div>
                </div>
            </SheetContent>

            {currentRequest && (
                <>
                    <RegisterPaymentDialog 
                        requestId={currentRequest.id} 
                        open={showPaymentDialog} 
                        onOpenChange={setShowPaymentDialog}
                        existingData={executionData}
                        onSuccess={loadAllData} 
                    />
                    <RegisterReceptionDialog 
                        requestId={currentRequest.id}
                        open={showReceptionDialog}
                        onOpenChange={setShowReceptionDialog}
                        onSuccess={() => {
                            toast.success("Ingreso registrado.");
                            loadAllData(); // RECARGAMOS AL GUARDAR
                        }}
                    />
                </>
            )}
        </Sheet>
    );
}

function StatusBadge({ code, label }: { code: string, label: string }) {
    let styles = "bg-gray-100 text-gray-600 border-gray-200"; 
    if (code === 'VALIDADA') styles = "bg-purple-100 text-purple-800 border-purple-200";
    if (code === 'PENDIENTE') styles = "bg-yellow-50 text-yellow-700 border-yellow-200";
    if (code === 'APROBADO') styles = "bg-green-100 text-green-800 border-green-200";
    if (code === 'RECHAZADO') styles = "bg-red-100 text-red-800 border-red-200";
    if (code === 'COMPLETADO' || code === 'COMPRA REALIZADA') styles = "bg-blue-100 text-blue-800 border-blue-200";
    return <Badge className={`${styles} shadow-none border font-medium pl-2 pr-2.5 py-0.5`}>{label || code}</Badge>;
}