'use client'

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import { rejectRequest } from "@/actions/purchase-actions"; 
import { toast } from "sonner";

interface RejectModalProps {
    requestId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ⚠️ Asegúrate de que esta línea tenga la palabra 'export' al inicio
export function RejectModal({ requestId, open, onOpenChange }: RejectModalProps) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReject = async () => {
        if (reason.trim().length < 5) {
            toast.error("Por favor ingrese un motivo detallado (mínimo 5 letras).");
            return;
        }

        setLoading(true);
        const res = await rejectRequest(requestId, reason);
        setLoading(false);

        if (res.success) {
            toast.success(res.message);
            onOpenChange(false);
            setReason(""); // Limpiar
        } else {
            toast.error(res.message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-red-200">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertTriangle className="h-6 w-6" />
                        <DialogTitle>Rechazar Solicitud #{requestId}</DialogTitle>
                    </div>
                    <DialogDescription>
                        Esta acción es irreversible. La solicitud pasará a estado <b>RECHAZADO</b> y el solicitante verá el motivo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    <Label htmlFor="reason" className="text-red-800 font-semibold">
                        Motivo del rechazo <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="reason"
                        placeholder="Ej: El presupuesto excede el límite permitido para este mes..."
                        className="resize-none h-24 focus-visible:ring-red-500"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={handleReject}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Confirmar Rechazo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}