'use client'

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    MapPin, 
    AlertTriangle, 
    Eye, 
    AlertCircle, 
    CheckCircle2, 
    CalendarClock 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InventoryHistoryDialog } from "@/components/modules/inventario/inventory-history-dialog";

export function InventoryTable({ stocks }: { stocks: any[] }) {
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Función auxiliar para obtener estilos según el estado
    const getStockBadgeStyles = (status: string) => {
        switch (status) {
            case 'CRITICAL':
                return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
            case 'WARNING':
                return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
            default: // OK
                return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
        }
    };

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="w-[180px]">Sucursal</TableHead>
                        <TableHead className="w-[100px]">Código</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Stock Actual</TableHead>
                        <TableHead className="w-[160px]">Alertas / Venc.</TableHead> {/* Nueva Columna */}
                        <TableHead className="text-right w-[120px]">Última Act.</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stocks.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50 transition-colors group">
                            
                            {/* SUCURSAL */}
                            <TableCell className="font-medium text-gray-600">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {item.branch_name}
                                </div>
                            </TableCell>
                            
                            {/* CÓDIGO */}
                            <TableCell className="font-mono text-xs text-gray-500">
                                {item.product_code || '-'}
                            </TableCell>
                            
                            {/* PRODUCTO */}
                            <TableCell className="font-bold text-gray-800">
                                {item.product_name}
                            </TableCell>
                            
                            {/* STOCK CON SEMÁFORO */}
                            <TableCell className="text-right">
                                <div className="flex justify-end">
                                    <Badge 
                                        variant="outline" 
                                        className={cn(
                                            "font-mono text-sm px-3 py-1 flex items-center gap-1.5 transition-colors cursor-help",
                                            getStockBadgeStyles(item.stock_status)
                                        )}
                                        title={
                                            item.stock_status === 'CRITICAL' ? `Stock Crítico (Mín: ${item.min_stock})` :
                                            item.stock_status === 'WARNING' ? `Punto de Reorden (Reorden: ${item.reorder_point})` :
                                            'Stock Saludable'
                                        }
                                    >
                                        {/* Icono dinámico */}
                                        {item.stock_status === 'CRITICAL' && <AlertCircle className="w-3.5 h-3.5" />}
                                        {item.stock_status === 'WARNING' && <AlertTriangle className="w-3.5 h-3.5" />}
                                        {item.stock_status === 'OK' && <CheckCircle2 className="w-3.5 h-3.5 opacity-50" />}
                                        
                                        {Number(item.stock_current).toFixed(2)} {item.unit_measure}
                                    </Badge>
                                </div>
                            </TableCell>

                            {/* ALERTAS DE VENCIMIENTO (NUEVO) */}
                            <TableCell>
                                {Number(item.expiring_soon_qty) > 0 ? (
                                    <div className="flex items-center gap-1.5 text-orange-700 bg-orange-50 border border-orange-100 px-2 py-1 rounded-md w-fit">
                                        <CalendarClock className="w-3.5 h-3.5" />
                                        <div className="flex flex-col leading-none">
                                            <span className="text-xs font-bold">{item.expiring_soon_qty} unid.</span>
                                            <span className="text-[10px] opacity-80">vencen pronto</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-gray-300 text-xs">-</span>
                                )}
                            </TableCell>

                            {/* FECHA */}
                            <TableCell className="text-xs text-gray-400 text-right">
                                {item.last_update ? new Date(item.last_update).toLocaleDateString() : '-'}
                            </TableCell>
                            
                            {/* BOTÓN DETALLE */}
                            <TableCell>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    onClick={() => setSelectedItem(item)}
                                    title="Ver Historial de Movimientos"
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}

                    {/* ESTADO VACÍO */}
                    {stocks.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                                <div className="flex flex-col items-center gap-2">
                                    <AlertTriangle className="w-8 h-8 opacity-20" />
                                    <p>No se encontró stock con los filtros actuales.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* MODAL DE HISTORIAL */}
            {selectedItem && (
                <InventoryHistoryDialog 
                    isOpen={!!selectedItem} 
                    onOpenChange={(open) => !open && setSelectedItem(null)}
                    
                    // IDs
                    branchId={selectedItem.branch_id}
                    productId={selectedItem.product_id}
                    
                    // Info
                    productName={selectedItem.product_name}
                    branchName={selectedItem.branch_name}
                    
                    // Datos extra
                    currentStock={selectedItem.stock_current}
                    unitMeasure={selectedItem.unit_measure}
                    lastUpdate={selectedItem.last_update}
                />
            )}
        </>
    );
}