import { pool } from "@/lib/db";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react"; // Nuevos iconos
import { getBranches } from "@/actions/purchase-actions"; 
import { InventoryTable } from "./inventory-table";
import { InventoryActionsButton } from "@/components/modules/inventario/inventory-actions-button";
import { InventoryFilters } from "@/components/modules/inventario/inventory-filters";

interface SearchParamsType {
    query?: string;
    branchId?: string;
    minStock?: string;
    maxStock?: string;
    dateFrom?: string;
    page?: string;
}

export default async function InventoryPage(props: {
    searchParams: Promise<SearchParamsType>;
}) {
    // 1. Next.js 15: Esperar params
    const searchParams = await props.searchParams;
    const session = await auth();
    
    // Configuración de usuario y sucursal...
    const userRole = session?.user?.role?.toUpperCase() || "";
    let userBranchId = 0;
    if (session?.user?.email) {
        try {
            const query = `SELECT ub.branch_id FROM user_branches ub INNER JOIN users u ON ub.user_id = u.id WHERE u.email = ? LIMIT 1`;
            const [rows]: any = await pool.query(query, [session.user.email]);
            if (rows.length > 0) userBranchId = rows[0].branch_id;
        } catch (error) { console.error(error); }
    }

    // Listas auxiliares
    const [productsList]: any = await pool.query("SELECT id, name, code FROM products WHERE status = 1 ORDER BY name ASC");
    const branches = await getBranches();

    // --- FILTROS ---
    const queryTerm = searchParams?.query || "";
    const branchFilter = searchParams?.branchId || "";
    
    let whereClause = "WHERE p.status = 1";
    const queryParams: any[] = [];

    if (queryTerm) {
        whereClause += " AND (p.name LIKE ? OR p.code LIKE ?)";
        queryParams.push(`%${queryTerm}%`, `%${queryTerm}%`);
    }

    if (branchFilter && branchFilter !== "ALL") {
        whereClause += " AND ps.branch_id = ?";
        queryParams.push(branchFilter);
    }

    // --- CONSULTA PRINCIPAL MEJORADA ---
    // Agregamos lógica CASE para determinar el nivel de alerta directamente desde SQL
    // y una subconsulta (LEFT JOIN) para detectar cuántos items vencen en los próximos 30 días.
    const sql = `
        SELECT 
            ps.id, ps.branch_id, ps.product_id,
            b.name as branch_name,
            p.code as product_code, p.name as product_name, p.unit_measure,
            ps.stock_current, 
            ps.min_stock, 
            ps.reorder_point,
            ps.last_update,
            
            -- Lógica de Semáforo de Stock
            CASE 
                WHEN ps.stock_current <= ps.min_stock THEN 'CRITICAL'
                WHEN ps.stock_current <= ps.reorder_point THEN 'WARNING'
                ELSE 'OK'
            END as stock_status,

            -- Subconsulta para alertas de Vencimiento (Próximos 30 días)
            -- Nota: Esto requiere la tabla 'product_batches'. Si no la tienes, devolverá NULL/0
            COALESCE(
                (SELECT SUM(quantity) 
                 FROM product_batches pb 
                 WHERE pb.product_id = ps.product_id 
                 AND pb.branch_id = ps.branch_id 
                 AND pb.expiration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
                ), 0
            ) as expiring_soon_qty

        FROM product_stocks ps
        INNER JOIN products p ON ps.product_id = p.id
        INNER JOIN branches b ON ps.branch_id = b.id
        ${whereClause}
        ORDER BY 
            -- Priorizar alertas críticas arriba
            (ps.stock_current <= ps.min_stock) DESC, 
            b.name ASC, p.name ASC
    `;

    const [stocks]: any = await pool.query(sql, queryParams);

    // Cálculos de KPI rápidos para el Header
    const criticalCount = stocks.filter((s: any) => s.stock_status === 'CRITICAL').length;
    const expiringCount = stocks.reduce((acc: number, curr: any) => acc + (Number(curr.expiring_soon_qty) || 0), 0);

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
            {/* HEADER CON INDICADORES */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-600" />
                        Inventario Inteligente
                    </h1>
                    <p className="text-gray-500 text-sm">Monitoreo de existencias y caducidad.</p>
                </div>
                
                {/* TARJETAS DE ALERTA RÁPIDA */}
                <div className="flex gap-3">
                    {criticalCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 shadow-sm animate-pulse">
                            <AlertCircle className="w-5 h-5" />
                            <div className="flex flex-col leading-none">
                                <span className="font-bold text-lg">{criticalCount}</span>
                                <span className="text-[10px] uppercase font-semibold">Stock Crítico</span>
                            </div>
                        </div>
                    )}
                    {expiringCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 shadow-sm">
                            <AlertTriangle className="w-5 h-5" />
                            <div className="flex flex-col leading-none">
                                <span className="font-bold text-lg">{expiringCount}</span>
                                <span className="text-[10px] uppercase font-semibold">Vencen pronto</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <InventoryFilters 
                branches={branches} 
                products={productsList} 
                userBranchId={userBranchId}
                userRole={userRole}
            />

            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm w-fit">
                <InventoryActionsButton 
                    branches={branches} 
                    userRole={userRole} 
                    userBranchId={userBranchId} 
                />
                <div className="h-6 w-px bg-gray-200 mx-1"></div>
                <span className="text-xs text-gray-400 font-medium px-2">
                    Total: {stocks.length} items
                </span>
            </div>
            
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <CardTitle className="text-base font-medium text-gray-700">Tablero de Existencias</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Pasamos los datos enriquecidos a la tabla */}
                    <InventoryTable stocks={stocks} />
                </CardContent>
            </Card>
        </div>
    );
}