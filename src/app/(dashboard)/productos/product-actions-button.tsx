'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateProductDialog } from "@/components/modules/productos/create-product-dialog";

export function ProductActionsButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
            </Button>
            
            <CreateProductDialog open={open} onOpenChange={setOpen} />
        </>
    );
}