'use client'

import { useState, useTransition } from "react";
import { deleteClient } from "@/actions/client-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, Copy, Pencil, Loader2 } from "lucide-react";
import { ClientFormSheet } from "./client-form-sheet";
// 1. IMPORTAR TOAST DE SONNER
import { toast } from "sonner";

export function ClientActions({ client }: { client: any }) {
  const [openAlert, setOpenAlert] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteClient(client.id);
      setOpenAlert(false);
      
      // 2. USAR TOAST DIRECTO
      if (res.success) {
        toast.success("Cliente eliminado correctamente");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        {/* ... (El resto del renderizado sigue IGUAL, no cambia nada) ... */}
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          
          <DropdownMenuItem onClick={() => {
              navigator.clipboard.writeText(client.doc_number);
              toast.success("Documento copiado al portapapeles"); // Feedback visual extra
          }}>
            <Copy className="mr-2 h-4 w-4" /> Copiar Doc
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
             <Pencil className="mr-2 h-4 w-4 text-blue-600" /> Editar
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setOpenAlert(true)} 
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ClientFormSheet 
        clientId={client.id} 
        mode="edit" 
        isOpen={openEdit} 
        onOpenChange={setOpenEdit} 
      />

      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              El cliente <b>{client.display_name}</b> será marcado como eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => { e.preventDefault(); handleDelete(); }}
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}