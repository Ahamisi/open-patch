"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Health = {
  mubit: { configured: boolean; model: string; mockMode: boolean };
  sapling: { ok: boolean; detail: string };
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const links = [
    { href: "/", label: "Scans" },
    { href: "/demo", label: "Demo" },
    { href: "/learning", label: "Intelligence" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-ink-600/80 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tracking-tight">Open Patch</span>
            <span className="hidden text-xs uppercase tracking-[0.2em] text-mist-500 sm:inline">
              Night Shift
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-mist-300">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname === link.href ? "text-ember" : "hover:text-mist-100"}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em]">
            <StatusDot
              ok={Boolean(health?.mubit.configured)}
              label={health?.mubit.mockMode ? "Mubit mock" : "Mubit live"}
            />
            <StatusDot ok={Boolean(health?.sapling.ok)} label="Sapling" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="chip border-ink-600 text-mist-300">
      <span className={`mr-2 h-1.5 w-1.5 rounded-full ${ok ? "bg-signal-clear" : "bg-signal-affected"}`} />
      {label}
    </span>
  );
}
