import { Hero } from "@/components/landing/Hero";
import { VenueGrid } from "@/components/landing/VenueGrid";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main>
        <Hero />
        <VenueGrid />
        
        {/* About Section */}
        <section id="about" className="w-full bg-zinc-50 py-16 lg:py-32 px-6 border-t-[0.5px] border-zinc-200">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="font-serif text-3xl lg:text-5xl font-light tracking-tighter text-black leading-tight">
                  Curated Spaces for <br className="hidden lg:block" /> Iconic Moments.
                </h2>
                <div className="mt-8 lg:mt-12 space-y-6 text-zinc-500 max-w-lg leading-relaxed text-sm lg:text-base">
                  <p>
                    ESPACE is a collection of high-end event venues designed for those who value 
                    aesthetic precision and functional excellence. From minimalist galleries 
                    to industrial lofts, every space in our portfolio is hand-picked.
                  </p>
                  <p>
                    Our mission is to simplify the booking experience without compromising 
                    on the institutional quality that professional event planners demand.
                  </p>
                </div>
              </div>
              <div className="relative aspect-square bg-zinc-200 border-[0.5px] border-zinc-300 overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
                  alt="Institutional Minimalist Core"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="w-full bg-white py-16 lg:py-32 px-6 border-t-[0.5px] border-zinc-200">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 lg:mb-16">
              <h2 className="font-serif text-3xl lg:text-4xl tracking-tighter text-black">Get in Touch</h2>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Connect with our venue curators</p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ContactCard label="Email" value="concierge@espace.com" />
              <ContactCard label="Location" value="Level 42, Elite Tower, KL" />
              <ContactCard label="Phone" value="+60 12 345 6789" />
            </div>
          </div>
        </section>
      </main>
      
      <footer className="w-full bg-white py-12 border-t-[0.5px] border-zinc-200 px-6 text-center">
        <div className="mb-8 flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <a href="#" className="hover:text-black transition-colors">Instagram</a>
          <a href="#" className="hover:text-black transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-black transition-colors">Twitter</a>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          ESPACE &copy; 2026. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}

function ContactCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="border-[0.5px] border-zinc-200 p-8 hover:bg-zinc-50 transition-colors group">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">{label}</p>
      <p className="text-lg font-serif tracking-tight text-black group-hover:translate-x-1 transition-transform">{value}</p>
    </div>
  );
}
