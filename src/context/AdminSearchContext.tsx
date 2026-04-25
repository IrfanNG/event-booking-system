"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type AdminSearchScope = "dashboard" | "bookings" | "customers" | "finance" | "venues" | "default";

interface AdminSearchContextType {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  clearSearch: () => void;
  placeholder: string;
  scope: AdminSearchScope;
}

const AdminSearchContext = createContext<AdminSearchContextType | undefined>(undefined);

const scopePlaceholders: Record<AdminSearchScope, string> = {
  dashboard: "Search reservations...",
  bookings: "Search bookings...",
  customers: "Search clients...",
  finance: "Search ledger entries...",
  venues: "Search venues...",
  default: "Search admin records..."
};

function getAdminSearchScope(pathname: string | null): AdminSearchScope {
  if (!pathname) return "default";

  const topLevelRoute = pathname.split("/")[2] as AdminSearchScope | undefined;

  if (topLevelRoute && topLevelRoute in scopePlaceholders) {
    return topLevelRoute;
  }

  return "default";
}

export function AdminSearchProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scope = getAdminSearchScope(pathname);
  const [searchTerms, setSearchTerms] = useState<Partial<Record<AdminSearchScope, string>>>({});

  const searchTerm = searchTerms[scope] ?? "";
  const placeholder = scopePlaceholders[scope];

  const value = useMemo<AdminSearchContextType>(() => {
    const setSearchTerm = (nextValue: string) => {
      setSearchTerms((current) => ({
        ...current,
        [scope]: nextValue
      }));
    };

    const clearSearch = () => {
      setSearchTerms((current) => ({
        ...current,
        [scope]: ""
      }));
    };

    return {
      searchTerm,
      setSearchTerm,
      clearSearch,
      placeholder,
      scope
    };
  }, [placeholder, scope, searchTerm]);

  return <AdminSearchContext.Provider value={value}>{children}</AdminSearchContext.Provider>;
}

export function useAdminSearch() {
  const context = useContext(AdminSearchContext);

  if (context === undefined) {
    throw new Error("useAdminSearch must be used within an AdminSearchProvider");
  }

  return context;
}
