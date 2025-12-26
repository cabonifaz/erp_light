import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { auth } from "@/auth"; // 1. Importamos auth

// 2. Convertimos la función en async para poder usar await
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 3. Obtenemos la sesión en el servidor
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col md:ml-64 min-h-screen">
        {/* 4. Pasamos el usuario como prop al Header */}
        <Header user={session?.user} />
        
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}