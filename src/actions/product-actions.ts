'use server'

import { pool } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// --- CREAR NUEVO PRODUCTO ---
export async function createProduct(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "No autorizado" };

    const role = session.user.role?.toUpperCase() || "";
    // Validación de roles permitidos
    const ALLOWED_ROLES = ['LOGISTICA', 'ADMINISTRADOR GENERAL', 'CEO'];

    if (!ALLOWED_ROLES.includes(role)) {
        return { success: false, message: "⛔ No tienes permisos para crear productos." };
    }

    // Recibimos datos del formulario
    const name = formData.get("name") as string;
    const unit_measure = formData.get("unit_measure") as string;
    const description = formData.get("description") as string;
    
    // OJO: Ya no validamos 'code' aquí porque se genera abajo
    if (!name || !unit_measure) {
        return { success: false, message: "El nombre y la unidad son obligatorios." };
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. GENERAR CÓDIGO AUTOMÁTICO (Ej: PROD-000052)
        const [lastRow]: any = await connection.query("SELECT MAX(id) as max_id FROM products");
        const nextId = (lastRow[0]?.max_id || 0) + 1;
        const autoCode = `PROD-${nextId.toString().padStart(6, '0')}`;

        // 2. INSERTAR EN BASE DE DATOS
        // Usamos session.user.id para 'created_by'
        const [result]: any = await connection.query(`
            INSERT INTO products (
                name, 
                code, 
                description, 
                unit_measure, 
                status, 
                created_by, 
                created_at
            )
            VALUES (?, ?, ?, ?, 1, ?, NOW())
        `, [
            name.toUpperCase(), 
            autoCode, 
            description || null, 
            unit_measure, 
            session.user.id 
        ]);

        const newId = result.insertId;

        await connection.commit();

        // Revalidamos las rutas para que la lista se actualice
        revalidatePath("/admin/productos");
        revalidatePath("/inventario"); 
        
        // Devolvemos el producto creado para usarlo en el frontend
        return { 
            success: true, 
            message: `Producto creado: ${autoCode}`,
            product: {
                id: newId,
                name: name.toUpperCase(),
                code: autoCode,
                unit_measure: unit_measure
            }
        };

    } catch (error: any) {
        await connection.rollback();
        console.error("Error creando producto:", error);
        return { success: false, message: error.message || "Error en base de datos" };
    } finally {
        connection.release();
    }
}

// --- LISTAR PRODUCTOS ---
export async function getProductsList() {
    try {
        const [rows]: any = await pool.query(`
            SELECT * FROM products 
            WHERE status = 1 
            ORDER BY created_at DESC
        `);
        return rows;
    } catch (error) {
        console.error("Error al listar productos:", error);
        return [];
    }
}