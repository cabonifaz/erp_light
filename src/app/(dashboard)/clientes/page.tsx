import { getClients } from "@/actions/client-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
// Importamos el formulario para el botón "Nuevo Cliente"
import { ClientFormSheet } from "@/components/modules/clientes/client-form-sheet";
// Importamos el menú de acciones (LOS PUNTITOS)
import { ClientActions } from "@/components/modules/clientes/client-actions";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Directorio de personas y empresas.</p>
        </div>
        {/* Botón de Crear (Reutiliza el mismo form con mode='create') */}
        <ClientFormSheet mode="create" />
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardHeader className="pb-2 border-b border-gray-100 bg-gray-50/50">
            <CardTitle className="text-lg font-semibold text-gray-700">Listado General</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-[300px]">Cliente</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Estado</TableHead>
                {/* 1. COLUMNA NUEVA PARA ACCIONES */}
                <TableHead className="text-right">Acciones</TableHead> 
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client: any) => (
                <TableRow key={client.id} className="hover:bg-blue-50/30 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900 text-sm">{client.display_name}</span>
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">
                            {client.client_type_desc}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="font-mono text-sm font-medium text-gray-700">{client.doc_number}</span>
                        <span className="text-xs text-gray-400">{client.doc_internal_code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                        {client.email ? (
                            <span className="text-xs text-gray-600 flex items-center gap-1 truncate max-w-[150px]">
                                {client.email}
                            </span>
                        ) : <span className="text-xs text-gray-300">-</span>}
                        
                        {client.phone ? (
                            <span className="text-xs text-gray-500">{client.phone}</span>
                        ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                        className={client.status === 1 
                            ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-none" 
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200 shadow-none"}
                    >
                      {client.status === 1 ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  
                  {/* 2. AQUÍ SE RENDERIZAN LOS PUNTITOS */}
                  <TableCell className="text-right">
                    <ClientActions client={client} />
                  </TableCell>
                </TableRow>
              ))}
              
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <p className="font-medium">No hay clientes registrados</p>
                        <p className="text-sm text-gray-400">Utiliza el botón "Nuevo Cliente" para agregar uno.</p>
                    </div>
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