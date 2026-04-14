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
    sidebar_min_guests: "Min 1 guest",
    sidebar_max_guests: "Max {count} guests",
    sidebar_timeslot: "Time Slot",
    sidebar_name: "Full Name",
    sidebar_email: "Email Address",
    sidebar_phone: "Phone Number",
    slot_full: "Full Day (8AM - 10PM)",
    slot_morning: "Morning (8AM - 1PM)",
    slot_evening: "Evening (2PM - 10PM)",
    
    // Validation
    val_required: "This field is required",
    val_invalid_email: "Please enter a valid email",
    
    // Confirmation
    confirm_title: "Confirm Your Reservation",
    confirm_summary: "Review details before final confirmation.",
    confirm_venue: "Venue",
    confirm_date: "Booking Date",
    confirm_time: "Time Slot",
    confirm_guest_count: "No. of Guests",
    confirm_back: "Go Back",
    confirm_final: "Confirm Booking",
    
    // Success
    success_title: "Booking Confirmed.",
    success_msg: "Your reservation for {name} has been received. Check your invite dashboard for details soon.",
    success_ref: "Reference ID",
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
    sidebar_min_guests: "Min 1 tetamu",
    sidebar_max_guests: "Maks {count} tetamu",
    sidebar_timeslot: "Slot Masa",
    sidebar_name: "Nama Penuh",
    sidebar_email: "Alamat Emel",
    sidebar_phone: "No. Telefon",
    slot_full: "Sepanjang Hari (8PG - 10MLM)",
    slot_morning: "Pagi (8PG - 1PTG)",
    slot_evening: "Petang/Malam (2PTG - 10MLM)",

    // Validation
    val_required: "Ruangan ini wajib diisi",
    val_invalid_email: "Sila masukkan emel yang sah",

    // Confirmation
    confirm_title: "Sahkan Tempahan Anda",
    confirm_summary: "Semak butiran sebelum pengesahan akhir.",
    confirm_venue: "Dewan",
    confirm_date: "Tarikh Tempahan",
    confirm_time: "Slot Masa",
    confirm_guest_count: "Bil. Tetamu",
    confirm_back: "Kembali",
    confirm_final: "Sahkan Tempahan",
    
    // Success
    success_title: "Tempahan Disahkan.",
    success_msg: "Tempahan anda untuk {name} telah diterima. Semak papan pemuka jemputan anda untuk butiran lanjut.",
    success_ref: "ID Rujukan",
    success_btn: "Kembali ke Papan Pemuka"
  }
}

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
