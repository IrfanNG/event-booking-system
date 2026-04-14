"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export function Navbar() {
  const { lang, setLang, t } = useLanguage();

  return (
    <nav className="sticky top-0 z-50 w-full border-b-[0.5px] border-zinc-200 bg-white/70 backdrop-blur-md dark:border-zinc-800 dark:bg-black/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50">
            ESPACE
          </Link>
          <div className="flex space-x-4 lg:space-x-8 text-[11px] lg:text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            <Link href="#venues" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">{t("nav_venues")}</Link>
            <Link href="#about" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">{t("nav_about")}</Link>
            <Link href="#contact" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">{t("nav_contact")}</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
      </div>
    </nav>
  );
}
