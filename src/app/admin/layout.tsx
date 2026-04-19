"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Bell, Search, Menu, X, LayoutDashboard, CalendarDays, Users, Wallet } from "lucide-react";
import { AuthProvider } from "@/context/AuthContext";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicAdminRoute = pathname === "/admin/login" || pathname === "/admin/setup";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <AuthProvider>
      <AdminGuard>
        <div className="flex min-h-screen bg-zinc-50 text-black">
          {!isPublicAdminRoute && <AdminSidebar />}
          
          <main className="flex-1 overflow-y-auto">
            {!isPublicAdminRoute && (
              <>
                <header className="flex h-16 items-center justify-between border-b-[0.5px] border-zinc-200 bg-white px-4 lg:px-8 font-sans shrink-0 sticky top-0 z-[200] pointer-events-auto">
                  <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
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

                    <div className="hidden sm:flex items-center gap-4 border-[0.5px] border-zinc-200 px-3 py-1.5 bg-zinc-50/50">
                      <Search className="h-4 w-4 text-zinc-400" />
                      <input 
                        type="text" 
                        placeholder="Search something..." 
                        className="bg-transparent text-sm outline-none w-48 lg:w-64 font-medium text-black placeholder:text-zinc-300" 
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 lg:gap-4">
                    <button className="relative rounded-full p-2 hover:bg-zinc-50">
                      <Bell className="h-4 w-4 text-zinc-600" />
                      <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                    </button>
                    <div className="h-8 w-8 rounded-full bg-zinc-100 border-[0.5px] border-zinc-200" />
                  </div>
                </header>

                {/* Mobile Menu Overlay */}
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
      </AdminGuard>
    </AuthProvider>
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
