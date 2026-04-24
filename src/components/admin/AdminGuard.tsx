"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isPublicAdminRoute } from "@/lib/adminRoutes";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublicRoute = pathname ? isPublicAdminRoute(pathname) : false;

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.replace("/admin/login");
    }
  }, [user, loading, router, isPublicRoute]);

  // Show nothing or a skeleton while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black font-serif text-sm tracking-widest uppercase text-zinc-400">
        Verifying Protocol...
      </div>
    );
  }

  // If on public route, or user is authenticated, render the children
  if (!user && !isPublicRoute) {
     return null; // Prevent flicker before redirect
  }

  return <>{children}</>;
}
