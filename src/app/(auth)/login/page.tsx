'use client'

import { useActionState, useEffect, useState } from 'react'; // <--- Importamos useEffect y useState
import { authenticate } from '@/actions/auth-actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox"; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);
  
  // ESTADOS PARA MANEJAR LOS VALORES Y EL CHECKBOX
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(false);

  // 1. AL CARGAR: Revisar si hay un correo guardado
  useEffect(() => {
    const savedEmail = localStorage.getItem("gterp_saved_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true); // Marcamos el checkbox si había un email guardado
    }
  }, []);

  // 2. AL ENVIAR: Guardar o borrar según el checkbox
  const handleSubmit = () => {
    if (remember) {
      localStorage.setItem("gterp_saved_email", email);
    } else {
      localStorage.removeItem("gterp_saved_email");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-blue-600">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-blue-700">GTERP Light</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Agregamos onSubmit al formulario para ejecutar nuestra lógica de localStorage antes del dispatch */}
          <form action={dispatch} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="usuario@empresa.com" 
                required 
                className="focus-visible:ring-blue-600"
                // AGREGADO: Atributos para autocompletado y estado
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
              </div>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                className="focus-visible:ring-blue-600"
                // AGREGADO: Atributo vital para que Chrome guarde la pass
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center space-x-2">
              {/* Checkbox controlado */}
              <Checkbox 
                id="remember" 
                name="remember" 
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked as boolean)}
              />
              <Label 
                htmlFor="remember" 
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Recordar usuario
              </Label>
            </div>

            {errorMessage && (
              <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                <AlertCircle className="h-4 w-4" />
                <p>{errorMessage}</p>
              </div>
            )}

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all" 
              disabled={isPending}
              type="submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Ingresar al Sistema'
              )}
            </Button>

          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center text-xs text-muted-foreground">
          &copy; 2025 GeekyTech - Sistema de Gestión ERP
        </CardFooter>
      </Card>
    </div>
  );
}