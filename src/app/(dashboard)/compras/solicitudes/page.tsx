import { getPurchaseRequests } from "@/actions/purchase-actions";
import { RequestFormSheet } from "@/components/modules/compras/request-form-sheet";
import { PurchaseRequestActions } from "@/components/modules/compras/purchase-request-actions"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
// 1. AGREGAMOS EL ICONO MessageSquare
import { ShoppingCart, Calendar, MapPin, User, FileText, MessageSquare } from "lucide-react";
import { auth } from "@/auth";
import { pool } from "@/lib/db"; 

const money = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: currency }).format(amount);
};

const formatDate = (dateString: string) => {
    if(!dateString) return "-";
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default async function PurchaseRequestsPage() {
  const requests = await getPurchaseRequests();
  const session = await auth();
  
  const userRole = session?.user?.role || '';
  let userBranchId: number | undefined = undefined;

  if (session?.user?.email) {
      try {
          const query = `
            SELECT ub.branch_id 
            FROM user_branches ub
            INNER JOIN users u ON ub.user_id = u.id
            WHERE u.email = ?
            LIMIT 1
          `;
          
          const [rows]: any = await pool.query(query, [session.user.email]);
          
          if (rows.length > 0) {
              userBranchId = rows[0].branch_id;
          }
      } catch (error) {
          console.error("Error obteniendo sucursal del usuario:", error);
      }
  }

  return (
    <div className="space-y-8 p-1 md:p-2">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Solicitudes de Compra</h1>
          <p className="text-sm text-muted-foreground">Gestione y apruebe los requerimientos de todas las sedes.</p>
        </div>
        
        <div className="w-full sm:w-auto">
            <RequestFormSheet userBranchId={userBranchId} />
        </div>
      </div>

      <Card className="shadow-sm border-gray-200 overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/40 px-6 py-4">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-md">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Bandeja de Requerimientos
                </CardTitle>
            </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-100">
                    <TableHead className="w-[100px] pl-6">Código</TableHead>
                    <TableHead className="w-[140px]">Fecha</TableHead>
                    <TableHead>Sucursal / Solicitante</TableHead>
                    <TableHead className="w-[30%]">Descripción</TableHead>
                    <TableHead className="text-right">Monto Est.</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right w-[50px] pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req: any) => (
                    <TableRow key={req.id} className="group transition-colors hover:bg-blue-50/40 border-b border-gray-50 last:border-0">
                      
                      <TableCell className="pl-6 font-mono text-xs font-medium text-gray-500">
                        REQ-{req.id.toString().padStart(6, '0')}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {formatDate(req.issue_date)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-gray-800 text-xs flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-blue-500" /> {req.branch_name}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1 ml-4">
                                <User className="w-3 h-3" /> {req.requester_name}
                            </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col gap-2">
                            {/* Descripción Principal */}
                            <p className="text-sm text-gray-700 line-clamp-2 leading-snug" title={req.description}>
                                {req.description}
                            </p>
                            
                            {/* Etiqueta Compra Directa */}
                            {req.is_direct_purchase === 1 && (
                                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 w-fit">
                                    ⚡ COMPRA DIRECTA
                                </span>
                            )}

                            {/* 2. VISUALIZACIÓN DEL COMENTARIO DE APROBACIÓN */}
                            {req.approval_comment && (
                                <div className="flex gap-2 items-start p-2 rounded-md bg-yellow-50/80 border border-yellow-100 mt-1">
                                    <MessageSquare className="w-3 h-3 text-yellow-600 mt-0.5 shrink-0" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-tight">Nota de aprobación:</span>
                                        <p className="text-xs text-gray-700 italic leading-relaxed">
                                            "{req.approval_comment}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right font-medium text-gray-900">
                        {money(req.estimated_total, req.currency)}
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <StatusBadge code={req.status_code} label={req.status_desc} />
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <PurchaseRequestActions 
                            request={req} 
                            userRole={userRole} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-24 text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center">
                                <FileText className="w-8 h-8 text-gray-300" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-gray-900">No hay solicitudes pendientes</p>
                                <p className="text-sm text-gray-400 mt-1">Las nuevas solicitudes aparecerán aquí.</p>
                            </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ code, label }: { code: string, label: string }) {
    let styles = "bg-gray-100 text-gray-600 border-gray-200"; 
    if (code === 'PENDIENTE') styles = "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
    if (code === 'APROBADO') styles = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
    if (code === 'COMPLETADO') styles = "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
    if (code === 'RECHAZADO') styles = "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";

    return (
        <Badge className={`${styles} shadow-none border font-semibold px-2.5 py-0.5 whitespace-nowrap`}>
            {label}
        </Badge>
    );
}