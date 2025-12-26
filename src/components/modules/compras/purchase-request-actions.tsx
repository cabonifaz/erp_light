'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, XCircle, Pencil, Eye } from "lucide-react";

// Imports de Componentes
import { ApproveModal } from "./approve-modal";
import { RequestFormSheet } from "./request-form-sheet";
import { ViewRequestSheet } from "./view-request-sheet";
import { RejectModal } from "./reject-modal"; // <--- IMPORTAR NUEVO MODAL

interface Props {
    request: any;
    userRole: string; 
}

export function PurchaseRequestActions({ request, userRole }: Props) {
  const [showViewSheet, setShowViewSheet] = useState(false);
  
  // Nuevo estado para el modal de rechazo
  const [showRejectModal, setShowRejectModal] = useState(false);

  const canApprove = ['ADMIN_SUC', 'LOGISTICA', 'CEO'].includes(userRole);
  const canEdit = request.status_code === 'PENDIENTE';

  return (
    <>
        <div className="flex items-center gap-2 justify-end">
        
        {/* 1. Botón APROBAR (Acción Rápida) */}
        {canApprove && request.status_code === 'PENDIENTE' && (
            <ApproveModal requestId={request.id} requestDesc={request.description} />
        )}

        {/* 2. Menú Desplegable */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel>Gestión</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={() => setShowViewSheet(true)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" /> Ver Detalle
            </DropdownMenuItem>
            
            {/* EDITAR */}
            {canEdit && (
                <div onSelect={(e) => e.preventDefault()}>
                    <RequestFormSheet 
                        requestToEdit={request}
                        trigger={
                            <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground w-full text-left">
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                            </button>
                        }
                    />
                </div>
            )}

            {/* RECHAZAR */}
            {canApprove && request.status_code === 'PENDIENTE' && (
                <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => setShowRejectModal(true)} // Abre el modal
                        className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                    >
                        <XCircle className="mr-2 h-4 w-4" /> Rechazar
                    </DropdownMenuItem>
                </>
            )}
            </DropdownMenuContent>
        </DropdownMenu>
        </div>

        {/* 3. COMPONENTES MODALES/SHEETS */}
        
        <ViewRequestSheet 
            request={request} 
            open={showViewSheet} 
            onOpenChange={setShowViewSheet} 
        />

        {/* MODAL DE RECHAZO */}
        <RejectModal 
            requestId={request.id}
            open={showRejectModal}
            onOpenChange={setShowRejectModal}
        />
    </>
  );
}