'use server'

import { pool } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// --- OBTENER HISTORIAL CON PAGINACIÓN Y FILTROS ---
export async function getProductHistory(
    branchId: number, 
    productId: number, 
    page: number = 1, 
    limit: number = 5,
    startDate?: string,
    endDate?: string
) {
    try {
        const offset = (page - 1) * limit;
        
        // 1. Construir cláusulas de fecha dinámicas
        let dateFilter = "";
        const params: any[] = [branchId, productId];

        if (startDate && endDate) {
            dateFilter = "AND im.created_at BETWEEN ? AND ?";
            // Agregamos hora inicio (00:00:00) y fin (23:59:59)
            params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
        }

        // 2. Query Principal (Datos)
        const sqlData = `
            SELECT 
                im.id,
                im.created_at,
                im.quantity,
                im.unit_measure,
                im.type,
                im.document_number as guide_number,
                im.document_path as guide_path,
                im.concept,
                COALESCE(
                    CONCAT(per.first_name, ' ', per.paternal_surname), 
                    u.email, 
                    'Usuario Desconocido'
                ) as user_name,
                pr.id as request_id,
                pi.invoice_number,
                pi.invoice_path,
                prov.name as provider_name,
                prov.ruc as provider_ruc
            FROM inventory_movements im
            LEFT JOIN users u ON im.user_id = u.id
            LEFT JOIN persons per ON u.person_id = per.id
            LEFT JOIN purchase_requests pr ON im.request_id = pr.id
            LEFT JOIN purchase_invoices pi ON im.invoice_id = pi.id
            LEFT JOIN providers prov ON pi.provider_id = prov.id
            WHERE im.branch_id = ? 
              AND im.product_id = ?
              ${dateFilter}
            ORDER BY im.created_at DESC
            LIMIT ? OFFSET ?
        `;

        // 3. Query de Conteo (Total de registros para paginador)
        const sqlCount = `
            SELECT COUNT(*) as total 
            FROM inventory_movements im 
            WHERE im.branch_id = ? AND im.product_id = ? ${dateFilter}
        `;

        // Ejecutar consultas
        // Nota: params ya tiene branch, product y fechas. Agregamos limit/offset solo al de Data.
        const [rows]: any = await pool.query(sqlData, [...params, limit, offset]);
        const [countRows]: any = await pool.query(sqlCount, params);

        return {
            data: rows,
            total: countRows[0].total,
            page,
            limit,
            totalPages: Math.ceil(countRows[0].total / limit)
        };

    } catch (error) {
        console.error("Error fetching product history:", error);
        return { data: [], total: 0, page: 1, limit: 5, totalPages: 0 };
    }
}

// ... (Mantén la función registerManualAdjustment tal cual estaba) ...
export async function registerManualAdjustment(formData: FormData) {
    // ... Tu código existente de registro ...
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "No autorizado" };
    const role = session.user.role?.toUpperCase() || "";
    // @ts-ignore
    const sessionBranchId = session.user.branch_id; 
    const PRIVILEGED_ROLES = ['CEO', 'LOGISTICA', 'ADMINISTRADOR GENERAL'];
    const STORE_ROLES = ['ADMIN_SUC', 'ALMACEN'];

    if (![...PRIVILEGED_ROLES, ...STORE_ROLES].includes(role)) {
        return { success: false, message: "⛔ Sin permisos para realizar ajustes." };
    }

    const product_id = formData.get("product_id");
    const quantity = parseFloat(formData.get("quantity") as string);
    const type = formData.get("type") as string;
    const reason = formData.get("reason") as string;
    const formBranchId = formData.get("branch_id");

    if (!product_id || !quantity || !type || !reason) {
        return { success: false, message: "Todos los campos son obligatorios." };
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        let targetBranchId: any = null;

        if (PRIVILEGED_ROLES.includes(role)) {
            if (!formBranchId) throw new Error("Debes seleccionar una sucursal.");
            targetBranchId = formBranchId;
        } else {
            if (!sessionBranchId) throw new Error("⛔ No tienes una sucursal asignada en tu sesión.");
            targetBranchId = sessionBranchId;
        }

        const [prodRows]: any = await connection.query("SELECT unit_measure FROM products WHERE id = ?", [product_id]);
        const uom = prodRows[0]?.unit_measure || 'UND';

        await connection.query(`
            INSERT INTO inventory_movements 
            (branch_id, user_id, type, concept, product_id, quantity, unit_measure, document_number, created_at)
            VALUES (?, ?, ?, 'AJUSTE', ?, ?, ?, ?, NOW())
        `, [targetBranchId, session.user.id, type, product_id, quantity, uom, reason]);

        const operation = type === 'INGRESO' ? '+' : '-';
        const [stockRows]: any = await connection.query(
            "SELECT id, stock_current FROM product_stocks WHERE branch_id = ? AND product_id = ?",
            [targetBranchId, product_id]
        );

        if (stockRows.length > 0) {
            if (type === 'SALIDA' && (Number(stockRows[0].stock_current) < quantity)) {
                throw new Error(`Stock insuficiente (Actual: ${stockRows[0].stock_current}).`);
            }
            await connection.query(
                `UPDATE product_stocks SET stock_current = stock_current ${operation} ?, last_update = NOW() WHERE id = ?`,
                [quantity, stockRows[0].id]
            );
        } else {
            if (type === 'SALIDA') throw new Error("No hay stock registrado para descontar.");
            await connection.query(
                "INSERT INTO product_stocks (branch_id, product_id, stock_current, last_update) VALUES (?, ?, ?, NOW())",
                [targetBranchId, product_id, quantity]
            );
        }

        await connection.commit();
        revalidatePath("/inventario");
        return { success: true, message: "Ajuste registrado correctamente." };

    } catch (error: any) {
        await connection.rollback();
        return { success: false, message: error.message };
    } finally {
        connection.release();
    }
}