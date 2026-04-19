"use client";

import React, { createContext, useContext, ReactNode } from "react";

type Language = "EN";

interface LanguageContextType {
  lang: Language;
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
    
    // About
    about_title: "Curated Spaces for Iconic Moments.",
    about_p1: "ESPACE is a collection of high-end event venues designed for those who value aesthetic precision and functional excellence. From minimalist galleries to industrial lofts, every space in our portfolio is hand-picked.",
    about_p2: "Our mission is to simplify the booking experience without compromising on the institutional quality that professional event planners demand.",
    
    // Contact
    contact_title: "Get in Touch",
    contact_subtitle: "Connect with our venue curators",
    contact_email: "Email",
    contact_location: "Location",
    contact_phone: "Phone",
    
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
    success_btn: "Back to Dashboard",

    // Categories
    cat_hall: "Hall",
    cat_studio: "Studio",
    cat_outdoor: "Outdoor",
    cat_office: "Office"
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang: Language = "EN";

  const t = (key: string) => {
    return (translations[lang] as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, t }}>
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

