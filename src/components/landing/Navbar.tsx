"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext"; // Keep useLanguage for t()
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const { t } = useLanguage(); // Only keep t for translations of static text
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Check if we are on a venue detail page
  const isVenuePage = pathname?.startsWith("/venues/");

  const scrollToTop = (e: React.MouseEvent) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const navLinks = [
    { href: "/#venues", label: t("nav_venues") },
    { href: "/#about", label: t("nav_about") },
    { href: "/#contact", label: t("nav_contact") },
    { href: "/track", label: "Track Booking" },
  ];

  return (
    <nav className="sticky top-0 z-[200] w-full border-b-[0.5px] border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black pointer-events-auto">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 relative">
        {/* Logo */}
        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
          <Link
            href="/"
            onClick={scrollToTop}
            className="font-serif text-xl sm:text-2xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 flex-shrink-0"
          >
            ESPACE
          </Link>

          {/* Desktop Links */}
          {!isVenuePage && (
            <div className="hidden lg:flex space-x-8 text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Actions */}
        {!isVenuePage && (
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/#venues"
              className="bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {t("btn_book_now")}
            </Link>
          </div>
        )}

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-2 relative z-[210]">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="flex h-12 w-12 items-center justify-center text-zinc-900 transition-colors active:bg-zinc-100 dark:text-zinc-50 dark:active:bg-zinc-900 cursor-pointer touch-none select-none"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X size={24} strokeWidth={1.5} className="pointer-events-none" />
            ) : (
              <Menu size={24} strokeWidth={1.5} className="pointer-events-none" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 top-[64px] z-[300] w-full border-b-[0.5px] border-zinc-200 bg-white px-6 py-10 shadow-2xl lg:hidden dark:border-zinc-800 dark:bg-zinc-950 pointer-events-auto"
          >
            <div className="flex flex-col space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-serif tracking-tight text-zinc-900 transition-colors hover:text-zinc-500 dark:text-zinc-50 dark:hover:text-zinc-400"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t-[0.5px] border-zinc-100 dark:border-zinc-900">
                <Link
                  href="/#venues"
                  onClick={() => setIsOpen(false)}
                  className="block w-full bg-black py-4 text-center text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {t("btn_book_now")}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
