import { auth } from "@/auth";
import { getProductsList } from "@/actions/product-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Search } from "lucide-react";
import { ProductActionsButton } from "./product-actions-button"; // Componente cliente

export default async function ProductsPage() {
    const session = await auth();
    const products = await getProductsList();
    
    // Verificamos permisos en el servidor para mostrar u ocultar el botón
    const userRole = session?.user?.role?.toUpperCase() || "";
    const canCreate = ['LOGISTICA', 'ADMINISTRADOR GENERAL', 'CEO'].includes(userRole);

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
            
            {/* Cabecera y Botón */}
            <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-600" />
                        Maestro de Productos
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Catálogo global de bienes y servicios.
                    </p>
                </div>

                {/* BOTÓN SOLO VISIBLE SI TIENE PERMISO */}
                {canCreate && (
                    <ProductActionsButton />
                )}
            </div>

            {/* Tabla de Productos */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="bg-gray-50/50 border-b pb-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium text-gray-700">Listado General</CardTitle>
                        <Badge variant="outline" className="bg-white">
                            {products.length} Registros
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                                <TableHead className="w-[150px]">Código</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="w-[100px] text-center">Unidad</TableHead>
                                <TableHead className="w-[100px] text-center">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((p: any) => (
                                <TableRow key={p.id} className="hover:bg-slate-50">
                                    <TableCell className="font-mono text-xs font-bold text-gray-600">
                                        {p.code}
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-800">
                                        {p.name}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500 truncate max-w-[300px]">
                                        {p.description || "-"}
                                    </TableCell>
                                    <TableCell className="text-center text-xs">
                                        <Badge variant="secondary" className="font-mono">
                                            {p.unit_measure}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none">
                                            Activo
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {products.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                                        No hay productos registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}