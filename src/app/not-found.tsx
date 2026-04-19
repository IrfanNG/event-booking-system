import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center text-black">
      <h1 className="font-serif text-8xl font-light tracking-tighter md:text-9xl">404</h1>
      <h2 className="mt-4 text-xl font-bold uppercase tracking-widest text-zinc-400">Page Not Found</h2>
      
      <p className="mx-auto mt-6 max-w-md text-sm font-medium text-zinc-500 leading-relaxed">
        The institutional space you are looking for does not exist or has been relocated. 
        Please verify the address or return to the main directory.
      </p>

      <Link 
        href="/"
        className="group mt-12 flex items-center gap-2 border-[0.5px] border-zinc-200 bg-white px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all hover:border-black hover:bg-black hover:text-white shadow-sm"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Return Home
      </Link>
    </div>
  );
}
