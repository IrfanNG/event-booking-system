"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";

export function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "#venues", label: t("nav_venues") },
    { href: "#about", label: t("nav_about") },
    { href: "#contact", label: t("nav_contact") },
  ];

  return (
    <nav className="sticky top-0 z-[100] w-full border-b-[0.5px] border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
          <Link
            href="/"
            className="font-serif text-xl sm:text-2xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 flex-shrink-0"
          >
            ESPACE
          </Link>

          {/* Desktop Links */}
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
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <button
            onClick={() => setLang(lang === "EN" ? "BM" : "EN")}
            className="flex h-8 w-12 items-center justify-center border-[0.5px] border-zinc-200 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            {lang}
          </button>
          <Link
            href="#venues"
            className="bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {t("btn_book_now")}
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={() => setLang(lang === "EN" ? "BM" : "EN")}
            className="flex h-10 w-12 items-center justify-center gap-1 border-[0.5px] border-zinc-200 text-[10px] font-bold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400"
          >
            <Globe size={12} strokeWidth={2} />
            {lang}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-10 w-10 items-center justify-center text-zinc-900 dark:text-zinc-50"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X size={24} strokeWidth={1.5} />
            ) : (
              <Menu size={24} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-[64px] z-[90] w-full border-b-[0.5px] border-zinc-200 bg-white/95 backdrop-blur-xl px-6 py-10 shadow-2xl lg:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
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
                  href="#venues"
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
