"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Wallet } from "lucide-react";

const navItems = [
  { icon: <LayoutDashboard className="h-4 w-4" />, label: "Dashboard", href: "/admin/dashboard" },
  { icon: <CalendarDays className="h-4 w-4" />, label: "Bookings", href: "/admin/bookings" },
  { icon: <Users className="h-4 w-4" />, label: "Customers", href: "/admin/customers" },
  { icon: <Wallet className="h-4 w-4" />, label: "Finance", href: "/admin/finance" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r-[0.5px] border-zinc-200 bg-white lg:block">
      <div className="flex h-16 items-center border-b-[0.5px] border-zinc-200 px-6">
        <Link href="/" className="font-serif text-xl font-bold tracking-tighter text-black">ESPACE ADMIN</Link>
      </div>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all ${
                isActive 
                  ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-200' 
                  : 'text-zinc-400 hover:text-black hover:bg-zinc-50'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
