import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { VenueGrid } from "@/components/landing/VenueGrid";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <VenueGrid />
      </main>
      
      <footer className="w-full py-12 border-t-[0.5px] border-zinc-200 px-6 dark:border-zinc-800 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          ESPACE &copy; 2026. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}
