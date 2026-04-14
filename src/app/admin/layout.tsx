"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Bell, Search } from "lucide-react";
import { AuthProvider } from "@/context/AuthContext";
import { AdminGuard } from "@/components/admin/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicAdminRoute = pathname === "/admin/login" || pathname === "/admin/setup";

  return (
    <AuthProvider>
      <AdminGuard>
        <div className="flex min-h-screen bg-zinc-50 text-black">
          {!isPublicAdminRoute && <AdminSidebar />}
          
          <main className="flex-1 overflow-y-auto">
            {!isPublicAdminRoute && (
              <header className="flex h-16 items-center justify-between border-b-[0.5px] border-zinc-200 bg-white px-8 font-sans shrink-0">
                <div className="flex items-center gap-4 border-[0.5px] border-zinc-200 px-3 py-1.5 bg-zinc-50/50">
                  <Search className="h-4 w-4 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Search something..." 
                    className="bg-transparent text-sm outline-none w-64 font-medium text-black placeholder:text-zinc-300" 
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button className="relative rounded-full p-2 hover:bg-zinc-50">
                    <Bell className="h-4 w-4 text-zinc-600" />
                    <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                  </button>
                  <div className="h-8 w-8 rounded-full bg-zinc-100 border-[0.5px] border-zinc-200" />
                </div>
              </header>
            )}

            {children}
          </main>
        </div>
      </AdminGuard>
    </AuthProvider>
  );
}
