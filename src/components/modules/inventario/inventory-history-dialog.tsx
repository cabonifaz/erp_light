'use client'

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, User, Calendar, Truck, FileCheck, ArrowUpCircle, ArrowDownCircle, AlertCircle, Clock, Package, ChevronLeft, ChevronRight, FilterX } from "lucide-react";
import { getProductHistory } from "@/actions/inventory-actions";
import { cn } from "@/lib/utils";

interface InventoryHistoryDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    branchId: number;
    productId: number;
    productName: string;
    branchName: string;
    currentStock: number;
    unitMeasure: string;
    lastUpdate: string | null;
}

export function InventoryHistoryDialog({ 
    isOpen, 
    onOpenChange, 
    branchId, 
    productId, 
    productName, 
    branchName,
    currentStock,
    unitMeasure,
    lastUpdate
}: InventoryHistoryDialogProps) {
    
    // Estados de Carga y Datos
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    
    // Estados de Paginación y Filtros
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    
    // Fechas (Strings YYYY-MM-DD para inputs nativos)
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Función de Carga
    const fetchData = () => {
        if (branchId && productId) {
            setLoading(true);
            getProductHistory(branchId, productId, page, 5, startDate, endDate)
                .then((res: any) => {
                    setHistory(res.data);
                    setTotalPages(res.totalPages);
                    setTotalRecords(res.total);
                })
                .finally(() => setLoading(false));
        }
    };

    // Efecto 1: Cargar al abrir o cambiar página
    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, page]); // Dependencia 'page' para recargar al paginar

    // Efecto 2: Resetear paginación si cambian los filtros y recargar
    // (Creamos una función wrapper para el botón buscar o efecto automático)
    const handleSearch = () => {
        setPage(1); // Volver a la primera página
        fetchData();
    };

    const handleClearFilters = () => {
        setStartDate("");
        setEndDate("");
        setPage(1);
        // Necesitamos un pequeño timeout o llamar directo porque el estado no se actualiza inmediatamente dentro de la misma función
        setTimeout(() => {
            // fetchData usará los estados vacíos
            if (branchId && productId) {
                setLoading(true);
                getProductHistory(branchId, productId, 1, 5, "", "")
                    .then((res: any) => {
                        setHistory(res.data);
                        setTotalPages(res.totalPages);
                        setTotalRecords(res.total);
                    })
                    .finally(() => setLoading(false));
            }
        }, 50);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-7xl max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
                
                {/* 1. HEADER FIJO */}
                <div className="p-6 pb-4 border-b bg-white">
                    <DialogHeader>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div className="space-y-1">
                                <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Kárdex / Historial
                                </DialogTitle>
                                <DialogDescription>
                                    Movimientos de inventario en <span className="font-semibold text-gray-700">{branchName}</span>
                                </DialogDescription>
                                <div className="pt-2">
                                    <h3 className="text-lg font-bold text-gray-800 leading-none">{productName}</h3>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-4 shadow-sm min-w-[200px]">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Package className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-0.5">Stock Actual</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-extrabold text-gray-900">{Number(currentStock).toFixed(2)}</span>
                                        <span className="text-sm font-medium text-gray-500">{unitMeasure}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            Act: {lastUpdate ? new Date(lastUpdate).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* BARRA DE FILTROS */}
                    <div className="mt-6 flex flex-wrap items-end gap-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                        <div className="space-y-1">
                            <Label className="text-xs">Desde</Label>
                            <Input 
                                type="date" 
                                className="h-8 text-xs bg-white w-36" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Hasta</Label>
                            <Input 
                                type="date" 
                                className="h-8 text-xs bg-white w-36" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                            />
                        </div>
                        <Button size="sm" onClick={handleSearch} className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-xs">
                            Filtrar
                        </Button>
                        {(startDate || endDate) && (
                            <Button size="sm" variant="ghost" onClick={handleClearFilters} className="h-8 px-2 text-gray-500 text-xs">
                                <FilterX className="w-3.5 h-3.5 mr-1" /> Limpiar
                            </Button>
                        )}
                        <div className="ml-auto text-xs text-gray-500 self-center">
                            Mostrando <b>{history.length}</b> de <b>{totalRecords}</b> movimientos
                        </div>
                    </div>
                </div>

                {/* 2. CUERPO SCROLLABLE (TABLA) */}
                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
                        </div>
                    ) : (
                        <div className="border rounded-md shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-[150px]">Fecha / Hora</TableHead>
                                        <TableHead className="w-[120px]">Tipo</TableHead>
                                        <TableHead className="w-[250px]">Detalle / Referencia</TableHead>
                                        <TableHead>Documentación</TableHead>
                                        <TableHead className="w-[180px]">Responsable</TableHead>
                                        <TableHead className="w-[120px] text-right">Cantidad</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.length > 0 ? (
                                        history.map((mov) => {
                                            const isIngreso = (mov.type === 'INGRESO') || (mov.concept === 'COMPRA');
                                            return (
                                                <TableRow key={mov.id} className="hover:bg-gray-50/50 transition-colors">
                                                    {/* FECHA */}
                                                    <TableCell className="align-top">
                                                        <div className="flex flex-col text-xs text-gray-600">
                                                            <div className="flex items-center gap-1.5 font-medium">
                                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                                {new Date(mov.created_at).toLocaleDateString()}
                                                            </div>
                                                            <span className="pl-5 text-[10px] text-gray-400">
                                                                {new Date(mov.created_at).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* TIPO */}
                                                    <TableCell className="align-top">
                                                        <Badge variant="outline" className={cn("flex w-fit items-center gap-1.5 pr-3 pl-2 py-1 font-semibold", isIngreso ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200")}>
                                                            {isIngreso ? <ArrowUpCircle className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
                                                            {mov.type || (isIngreso ? 'INGRESO' : 'SALIDA')}
                                                        </Badge>
                                                    </TableCell>

                                                    {/* DETALLE */}
                                                    <TableCell className="align-top text-sm">
                                                        {mov.concept === 'COMPRA' ? (
                                                            <div className="flex flex-col gap-1">
                                                                {mov.provider_name ? (
                                                                    <>
                                                                        <span className="font-semibold text-gray-700 flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-blue-500" />{mov.provider_name}</span>
                                                                        <span className="text-[10px] text-gray-400 ml-5">RUC: {mov.provider_ruc}</span>
                                                                    </>
                                                                ) : <span className="text-gray-400 italic">Proveedor no registrado</span>}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-semibold text-gray-700 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-orange-500" />{mov.concept || 'AJUSTE'}</span>
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded w-fit italic">"{mov.document_number || mov.guide_number || 'Sin motivo'}"</span>
                                                            </div>
                                                        )}
                                                    </TableCell>

                                                    {/* DOCS */}
                                                    <TableCell className="align-top">
                                                        <div className="flex flex-col gap-1.5">
                                                            {mov.invoice_number && <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium"><FileCheck className="w-3.5 h-3.5 text-green-600" />FC: {mov.invoice_number}</div>}
                                                            {mov.concept === 'COMPRA' && mov.guide_number && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-xs text-gray-500">GR: {mov.guide_number}</span>
                                                                    {mov.guide_path && <a href={mov.guide_path} target="_blank" className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 hover:underline">Ver PDF</a>}
                                                                </div>
                                                            )}
                                                            {mov.request_id && <span className="text-[10px] text-gray-400 font-mono">REF: REQ-{mov.request_id.toString().padStart(5, '0')}</span>}
                                                            {!mov.invoice_number && !mov.request_id && mov.concept !== 'COMPRA' && <span className="text-xs text-gray-300">-</span>}
                                                        </div>
                                                    </TableCell>

                                                    {/* RESPONSABLE */}
                                                    <TableCell className="align-top text-xs text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-gray-100 p-1.5 rounded-full"><User className="w-3 h-3 text-gray-500" /></div>
                                                            <span className="max-w-[120px] truncate" title={mov.user_name}>{mov.user_name}</span>
                                                        </div>
                                                    </TableCell>

                                                    {/* CANTIDAD */}
                                                    <TableCell className="align-top text-right">
                                                        <Badge variant="outline" className={cn("text-sm font-bold px-3 py-1 border-0", isIngreso ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                                            {isIngreso ? '+' : '-'}{Number(mov.quantity).toFixed(2)}
                                                            <span className="ml-1 text-[10px] font-normal opacity-70">{mov.unit_measure}</span>
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-16 text-gray-400">No se encontraron movimientos.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                {/* 3. FOOTER PAGINACIÓN (Fijo abajo) */}
                <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                    </Button>
                    
                    <span className="text-sm text-gray-600">
                        Página <b>{page}</b> de <b>{totalPages || 1}</b>
                    </span>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                    >
                        Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}