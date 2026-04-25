"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Search, Menu, X, LayoutDashboard, CalendarDays, Users, Wallet, XCircle } from "lucide-react";
import { AuthProvider } from "@/context/AuthContext";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { isPublicAdminRoute } from "@/lib/adminRoutes";
import { AdminSearchProvider, useAdminSearch } from "@/context/AdminSearchContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicRoute = pathname ? isPublicAdminRoute(pathname) : false;

  return (
    <AuthProvider>
      <AdminSearchProvider>
        <AdminGuard>
          <AdminShell isPublicRoute={isPublicRoute}>{children}</AdminShell>
        </AdminGuard>
      </AdminSearchProvider>
    </AuthProvider>
  );
}

function AdminShell({
  children,
  isPublicRoute
}: {
  children: React.ReactNode;
  isPublicRoute: boolean;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50 text-black">
      {!isPublicRoute && <AdminSidebar />}

      <main className="flex-1 overflow-y-auto">
        {!isPublicRoute && (
          <>
            <header className="flex h-16 items-center justify-between border-b-[0.5px] border-zinc-200 bg-white px-4 lg:px-8 font-sans shrink-0 sticky top-0 z-[200] pointer-events-auto">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                  }}
                  className="lg:hidden p-2 text-zinc-900 active:bg-zinc-100 rounded-sm cursor-pointer touch-none select-none relative z-[210]"
                >
                  {isMobileMenuOpen ? <X size={20} className="pointer-events-none" /> : <Menu size={20} className="pointer-events-none" />}
                </button>

                <AdminSearchBar />
              </div>
            </header>

            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="fixed inset-0 z-[70] lg:hidden bg-white"
                >
                  <div className="flex h-16 items-center justify-between border-b-[0.5px] border-zinc-200 px-6">
                    <span className="font-serif text-xl font-bold tracking-tighter text-black">ESPACE ADMIN</span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                      <X size={24} />
                    </button>
                  </div>
                  <nav className="p-6 space-y-4">
                    <MobileNavLink href="/admin/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileNavLink href="/admin/bookings" icon={<CalendarDays size={18} />} label="Bookings" onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileNavLink href="/admin/customers" icon={<Users size={18} />} label="Customers" onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileNavLink href="/admin/finance" icon={<Wallet size={18} />} label="Finance" onClick={() => setIsMobileMenuOpen(false)} />
                    <MobileNavLink href="/admin/venues" icon={<CalendarDays size={18} />} label="Venues" onClick={() => setIsMobileMenuOpen(false)} />
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {children}
      </main>
    </div>
  );
}

function AdminSearchBar() {
  const { searchTerm, setSearchTerm, clearSearch, placeholder } = useAdminSearch();

  return (
    <div className="hidden sm:flex items-center gap-3 border-[0.5px] border-zinc-200 px-3 py-1.5 bg-zinc-50/50">
      <Search className="h-4 w-4 text-zinc-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-transparent text-sm outline-none w-48 lg:w-64 font-medium text-black placeholder:text-zinc-300"
      />
      {searchTerm ? (
        <button type="button" onClick={clearSearch} className="text-zinc-300 hover:text-zinc-500">
          <XCircle className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function MobileNavLink({ href, icon, label, onClick }: { href: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`flex items-center gap-4 p-4 text-xs font-bold uppercase tracking-widest border-[0.5px] ${
        isActive ? 'bg-black text-white border-black' : 'border-zinc-200 text-zinc-500'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
