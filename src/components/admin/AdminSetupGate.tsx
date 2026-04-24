"use client";

import Link from "next/link";

interface AdminSetupGateProps {
  enabled: boolean;
  children: React.ReactNode;
}

export function AdminSetupGate({ enabled, children }: AdminSetupGateProps) {
  if (!enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="w-full max-w-lg border-[0.5px] border-zinc-200 bg-zinc-50 p-8 text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tighter text-black">Setup Disabled</h1>
          <p className="mt-3 text-sm text-zinc-500">
            Admin setup is disabled for this environment. Contact your system administrator if bootstrap access is required.
          </p>
          <Link
            href="/admin/login"
            className="mt-8 inline-flex items-center justify-center bg-black px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
