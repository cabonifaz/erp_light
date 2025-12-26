'use client'

import { useActionState, useState, useEffect } from "react";
import { createClient, updateClient, getClientById, getDocumentTypes, getClientTypes, getCountries } from "@/actions/client-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Plus, Pencil, Building2, User, Mail, Phone, MapPin, FileText, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Usamos Sonner para notificaciones

const Req = () => <span className="text-red-500 ml-1 font-bold">*</span>;

// DEFINICIÓN DE TIPOS (AQUÍ ESTABA EL FALTANTE)
interface ClientFormProps {
    clientId?: number;
    mode?: 'create' | 'edit';
    isOpen?: boolean;               // Opcional: Control externo
    onOpenChange?: (open: boolean) => void; // Opcional: Control externo
}

export function ClientFormSheet({ clientId, mode = 'create', isOpen, onOpenChange }: ClientFormProps) {
  // Estado interno (se usa si no vienen props externas)
  const [internalOpen, setInternalOpen] = useState(false);
  
  // LOGICA HÍBRIDA: Si pasan 'isOpen', es controlado. Si no, usa estado interno.
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const [loadingData, setLoadingData] = useState(false);
  
  // Maestros
  const [allDocTypes, setAllDocTypes] = useState<any[]>([]); 
  const [clientTypes, setClientTypes] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  
  // Datos del Formulario
  const [formData, setFormData] = useState<any>({ country: "PERÚ" });

  const [selectedType, setSelectedType] = useState<any>(null);
  const [filteredDocs, setFilteredDocs] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [openCountry, setOpenCountry] = useState(false);

  const action = mode === 'edit' ? updateClient : createClient;
  const [state, dispatch, isPending] = useActionState(action, null);

  // --- FILTRADO ---
  const filterDocs = (type: any, docs: any[], defaultId?: string) => {
    if (!type || !docs.length) return;
    let validDocs = [];
    if (type.internal_code === 'NAT') {
        validDocs = docs.filter(d => d.internal_code !== 'RUC');
        if (!defaultId) defaultId = validDocs.find(d => d.internal_code === 'DNI')?.id.toString();
    } else {
        validDocs = docs.filter(d => d.internal_code === 'RUC');
        if (!defaultId) defaultId = validDocs.find(d => d.internal_code === 'RUC')?.id.toString();
    }
    setFilteredDocs(validDocs);
    if(defaultId) setSelectedDocId(defaultId);
  };

  // --- CARGA DE DATOS ---
  useEffect(() => {
    if (open) {
      const init = async () => {
        setLoadingData(true);
        try {
            const [docs, cTypes, cCountries] = await Promise.all([getDocumentTypes(), getClientTypes(), getCountries()]);
            setAllDocTypes(docs);
            setClientTypes(cTypes);
            setCountries(cCountries);

            if (mode === 'edit' && clientId) {
                const client = await getClientById(clientId);
                if (client) {
                    setFormData(client);
                    const type = cTypes.find((c: any) => c.internal_code === client.client_code);
                    setSelectedType(type);
                    filterDocs(type, docs, client.doc_type_id.toString());
                }
            } else {
                const def = cTypes.find((c: any) => c.internal_code === 'NAT');
                if (def) {
                    setSelectedType(def);
                    filterDocs(def, docs);
                }
                setFormData({ country: "PERÚ" }); 
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingData(false);
        }
      };
      init();
    }
  }, [open, clientId, mode]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleTabChange = (code: string) => {
    const type = clientTypes.find((c: any) => c.internal_code === code);
    if (type) {
        setSelectedType(type);
        filterDocs(type, allDocTypes);
        setFormData((prev: any) => ({ ...prev, first_name: '', business_name: '' }));
    }
  };

  // Cierre y Notificación
  useEffect(() => {
    if (state?.success) {
        if(setOpen) setOpen(false); // Cerramos usando el setter correcto
        toast.success(state.message);
    } else if (state?.message) {
        toast.error(state.message);
    }
  }, [state, setOpen]);

  // Si no es controlado (es el botón de crear), mostramos el Trigger
  const showTrigger = !isControlled;

  return (
    // IMPORTANTE: Asegurarnos que setOpen exista antes de pasarlo
    <Sheet open={open} onOpenChange={setOpen || setInternalOpen}>
      {showTrigger && (
        <SheetTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
            </Button>
        </SheetTrigger>
      )}
      
      <SheetContent className="overflow-y-auto sm:max-w-xl w-full p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold text-gray-900">
            {mode === 'edit' ? 'Editar Cliente' : 'Registrar Cliente'}
          </SheetTitle>
          <SheetDescription>
            {mode === 'edit' ? 'Modifique los datos necesarios.' : 'Los campos marcados con * son obligatorios.'}
          </SheetDescription>
        </SheetHeader>
        
        {loadingData ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-blue-600"/></div>
        ) : (
            <>
            {clientTypes.length > 0 && selectedType && (
                <div className="mb-8 p-1 bg-gray-100/80 rounded-lg border border-gray-200">
                    <Tabs value={selectedType.internal_code} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-10 bg-transparent">
                            <TabsTrigger value="NAT" disabled={mode === 'edit'} className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"><User className="w-4 h-4 mr-2"/> Persona Natural</TabsTrigger>
                            <TabsTrigger value="JUR" disabled={mode === 'edit'} className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"><Building2 className="w-4 h-4 mr-2"/> Persona Jurídica</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            )}

            <div className="pb-8"> 
                <form action={dispatch} className="flex flex-col gap-6">
                <input type="hidden" name="client_id" value={clientId || ''} />
                <input type="hidden" name="client_type_id" value={selectedType?.id || ''} />
                <input type="hidden" name="client_code" value={selectedType?.internal_code || ''} />

                {/* IDENTIDAD */}
                <div className="space-y-5 border border-gray-100 p-5 rounded-xl bg-white shadow-sm">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-widest mb-1">
                        <FileText className="w-4 h-4" /><h3>Identificación</h3>
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 sm:col-span-5 space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Tipo Documento <Req /></Label>
                            <Select key={selectedType?.internal_code} name="doc_type_id" value={selectedDocId} onValueChange={setSelectedDocId} disabled={mode === 'edit'}> 
                                <SelectTrigger className="w-full bg-gray-50 border-gray-200 h-10"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent className="max-h-[200px] bg-white z-[9999]">
                                    {filteredDocs.map((dt) => (
                                        <SelectItem key={dt.id} value={dt.id.toString()}>{dt.internal_code}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-12 sm:col-span-7 space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Número de Documento <Req /></Label>
                            <Input name="doc_number" required value={formData.doc_number || ''} onChange={handleInputChange} readOnly={mode === 'edit'} className={`font-mono h-10 ${mode === 'edit' ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 border-gray-200'}`} placeholder="Ingrese número..." />
                        </div>
                    </div>
                    {selectedType?.internal_code === 'NAT' ? (
                        <div className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-gray-600">Nombres Completos <Req /></Label>
                                <Input name="first_name" required className="h-10" value={formData.first_name || ''} onChange={handleInputChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600">Ap. Paterno <Req /></Label>
                                    <Input name="paternal_surname" required className="h-10" value={formData.paternal_surname || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-600">Ap. Materno</Label>
                                    <Input name="maternal_surname" className="h-10" value={formData.maternal_surname || ''} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-gray-600">Razón Social <Req /></Label>
                                <Input name="business_name" required className="uppercase h-10" value={formData.business_name || ''} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-gray-600">Nombre Comercial</Label>
                                <Input name="trade_name" placeholder="Opcional" className="h-10" value={formData.trade_name || ''} onChange={handleInputChange} />
                            </div>
                        </div>
                    )}
                </div>

                {/* UBICACIÓN */}
                <div className="space-y-5 border border-gray-100 p-5 rounded-xl bg-white shadow-sm">
                    <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-widest mb-1">
                        <MapPin className="w-4 h-4" /><h3>Ubicación y Contacto</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">País</Label>
                            <input type="hidden" name="country" value={formData.country || ''} />
                            <Popover open={openCountry} onOpenChange={setOpenCountry}>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" role="combobox" className="w-full justify-between bg-gray-50 border border-gray-200 h-10 font-normal text-gray-900 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                                {formData.country || "Seleccionar..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[250px] p-0 z-[9999] bg-white border-gray-200">
                                <Command className="border-none shadow-none">
                                <CommandInput placeholder="Buscar país..." className="h-10 border-b border-gray-200 font-normal text-gray-900 shadow-none outline-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none" />
                                <CommandList>
                                    <CommandEmpty>No encontrado.</CommandEmpty>
                                    <CommandGroup>
                                    {countries.map((c) => (
                                        <CommandItem key={c.id} value={c.label} onSelect={(val) => {
                                            const found = countries.find(item => item.label.toLowerCase() === val.toLowerCase());
                                            setFormData((prev: any) => ({...prev, country: found ? found.value : val}));
                                            setOpenCountry(false);
                                        }}>
                                        <Check className={cn("mr-2 h-4 w-4", formData.country === c.value ? "opacity-100" : "opacity-0")} />
                                        {c.label}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-600">Departamento</Label><Input name="department" className="h-10" value={formData.department || ''} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-600">Provincia</Label><Input name="province" className="h-10" value={formData.province || ''} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-600">Distrito</Label><Input name="district" className="h-10" value={formData.district || ''} onChange={handleInputChange} /></div>
                    </div>
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-8 space-y-2"><Label className="text-xs font-semibold text-gray-600">Dirección <Req /></Label><Input name="address" required className="h-10" value={formData.address || ''} onChange={handleInputChange} /></div>
                        <div className="col-span-4 space-y-2"><Label className="text-xs font-semibold text-gray-600">C. Postal</Label><Input name="zip_code" className="h-10" value={formData.zip_code || ''} onChange={handleInputChange} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-600">Email</Label><Input name="email" type="email" className="h-10" value={formData.email || ''} onChange={handleInputChange} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-600">Teléfono</Label><Input name="phone" className="h-10" value={formData.phone || ''} onChange={handleInputChange} /></div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-100 mt-2">
                    <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg bg-blue-600 hover:bg-blue-700 transition-all" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (mode === 'edit' ? "GUARDAR CAMBIOS" : "GUARDAR REGISTRO")}
                    </Button>
                </div>
                </form>
            </div>
            </>
        )}
      </SheetContent>
    </Sheet>
  );
}