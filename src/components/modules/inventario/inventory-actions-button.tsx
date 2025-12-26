'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ManualEntryDialog } from "./manual-entry-dialog";

// Definimos la interfaz para recibir los nuevos datos
interface InventoryActionsButtonProps {
    branches: any[];
    userRole: string;      // <--- IMPORTANTE
    userBranchId: number;  // <--- IMPORTANTE
}

export function InventoryActionsButton({ branches, userRole, userBranchId }: InventoryActionsButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button 
                onClick={() => setOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-9 text-xs sm:text-sm"
            >
                <PlusCircle className="w-4 h-4 mr-2" />
                Ajuste Manual
            </Button>

            {/* Aquí pasamos los datos hacia abajo al Modal */}
            <ManualEntryDialog 
                open={open} 
                onOpenChange={setOpen} 
                branches={branches} 
                userRole={userRole}           // Pasamos el rol
                userBranchId={userBranchId}   // Pasamos el ID de sucursal
            />
        </>
    );
}