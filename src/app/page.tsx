import { testConnection } from "@/lib/db";

export default async function Home() {
  const isConnected = await testConnection();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Estado del Sistema GTERP Light
        </div>
      </div>

      <div className="mt-10 text-center">
        <h1 className="text-4xl font-bold mb-4 text-blue-600">GTERP Light Next</h1>
        
        {isConnected ? (
            <div className="p-4 bg-green-100 text-green-700 rounded-lg border border-green-300">
                ✅ Conexión a Base de Datos: <strong>EXITOSA</strong>
            </div>
        ) : (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
                ❌ Error: No se pudo conectar a MySQL. Revisa el archivo .env.local
            </div>
        )}
      </div>
    </main>
  );
}