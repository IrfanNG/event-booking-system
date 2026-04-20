"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { useLanguage } from "@/context/LanguageContext";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section id="hero" className="relative flex w-full flex-col items-center justify-center border-b-[0.5px] border-zinc-200 bg-white px-6 py-20 lg:py-32 text-center dark:border-zinc-800 dark:bg-black">
      <motion.div
        initial={{ y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl"
      >
        <h1 className="font-serif text-4xl font-light tracking-tighter text-black dark:text-white md:text-7xl lg:text-8vw leading-[1.1]">
          Espace. <br />
          {t("hero_title")}
        </h1>
        <p className="mx-auto mt-6 lg:mt-8 max-w-2xl text-base lg:text-xl text-zinc-600 dark:text-zinc-400">
          {t("hero_subtitle")}
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link 
            href="#venues"
            className="flex h-12 w-48 items-center justify-center bg-black text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
          >
            {t("btn_explore")}
          </Link>
          <Link 
            href="#about"
            className="flex h-12 w-48 items-center justify-center border-[0.5px] border-zinc-200 bg-zinc-50 text-sm font-bold uppercase tracking-widest text-zinc-950 transition-all hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:hover:bg-zinc-800"
          >
            {t("btn_learn_more")}
          </Link>
        </div>
      </motion.div>

      {/* Subtle bottom detail */}
      <div className="absolute bottom-8 flex w-full justify-between border-t-[0.5px] border-zinc-100 px-6 pt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:border-zinc-900">
        <span>{t("hero_curated")}</span>
        <span>{t("hero_hospitality")}</span>
        <span>Est. 2026</span>
      </div>
    </section>
  );
}
