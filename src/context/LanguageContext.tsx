"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "EN" | "BM";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
  EN: {
    // Navbar
    nav_venues: "Venues",
    nav_about: "About",
    nav_contact: "Contact",
    btn_book_now: "Book Now",
    
    // Hero
    hero_title: "Elite Venue Booking for Your Next Moment.",
    hero_subtitle: "Discover handpicked event spaces designed to elevate every occasion — from minimalist studios to grand atriums.",
    btn_explore: "Explore Venues",
    btn_learn_more: "Learn More",
    hero_curated: "Curated Selection",
    hero_hospitality: "Institutional Hospitality",
    
    // Venue Grid
    grid_title: "Our Venues",
    grid_subtitle: "Carefully curated spaces for every kind of event, from creative studios to formal ballrooms.",
    grid_all: "All Venues",
    grid_filtered: "Filtered View",
    
    // Venue Details
    details_back: "Home",
    details_about: "About this space",
    details_amenities: "Amenities",
    details_verified: "Verified Space",
    details_guests: "Up to {count} guests",
    details_reviews: "({count} Reviews)",
    
    // Sidebar
    sidebar_date: "Date",
    sidebar_select_date: "Select Date",
    sidebar_guests: "Guests",
    sidebar_reserve: "Reserve Now",
    sidebar_confirming: "Confirming...",
    sidebar_service_note: "Total includes 10% service agreement",
    sidebar_base: "Base Price",
    sidebar_fee: "Service Fee (10%)",
    sidebar_total: "Total",
    sidebar_day: "/ Day",
    
    // Success
    success_title: "Booking Confirmed.",
    success_msg: "Your reservation for {name} has been received. Check your invite dashboard for details soon.",
    success_btn: "Back to Dashboard"
  },
  BM: {
    // Navbar
    nav_venues: "Dewan",
    nav_about: "Tentang",
    nav_contact: "Hubungi",
    btn_book_now: "Tempah Sekarang",
    
    // Hero
    hero_title: "Tempahan Dewan Elit untuk Momen Seterusnya.",
    hero_subtitle: "Temui ruang acara terpilih yang direka untuk meningkatkan setiap acara — dari studio minimalis ke atrium megah.",
    btn_explore: "Terokai Dewan",
    btn_learn_more: "Ketahui Lanjut",
    hero_curated: "Pilihan Terpilih",
    hero_hospitality: "Hospitaliti Institusi",
    
    // Venue Grid
    grid_title: "Dewan Kami",
    grid_subtitle: "Ruang yang dikurasi dengan teliti untuk setiap jenis acara, dari studio kreatif ke dewan tari rasmi.",
    grid_all: "Semua Dewan",
    grid_filtered: "Paparan Terapis",
    
    // Venue Details
    details_back: "Utama",
    details_about: "Mengenai ruang ini",
    details_amenities: "Kemudahan",
    details_verified: "Ruang Disahkan",
    details_guests: "Sehingga {count} tetamu",
    details_reviews: "({count} Ulasan)",
    
    // Sidebar
    sidebar_date: "Tarikh",
    sidebar_select_date: "Pilih Tarikh",
    sidebar_guests: "Tetamu",
    sidebar_reserve: "Tempah Sekarang",
    sidebar_confirming: "Mengesahkan...",
    sidebar_service_note: "Jumlah termasuk 10% perjanjian servis",
    sidebar_base: "Harga Asas",
    sidebar_fee: "Yuran Servis (10%)",
    sidebar_total: "Jumlah",
    sidebar_day: "/ Hari",
    
    // Success
    success_title: "Tempahan Disahkan.",
    success_msg: "Tempahan anda untuk {name} telah diterima. Semak papan pemuka jemputan anda untuk butiran lanjut.",
    success_btn: "Kembali ke Papan Pemuka"
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("EN");

  const t = (key: string) => {
    return (translations[lang] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
