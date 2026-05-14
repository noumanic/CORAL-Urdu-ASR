"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/",         label: "Home"     },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/research", label: "Research" },
  { href: "/team",     label: "Team"     },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-strong border-b border-white/10" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 py-3.5 flex items-center justify-between">

        <Link href="/" className="group flex items-center gap-3">
          <span className="relative inline-flex items-center justify-center w-10 h-10 group-hover:scale-105 transition-transform">
            <span className="absolute inset-0 rounded-xl grad-aurora opacity-80 group-hover:opacity-100 transition-opacity" />
            <span className="absolute inset-[2px] rounded-[10px] bg-slate-950" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/coral-logo.png"
              alt="CORAL"
              className="relative w-7 h-7 object-contain"
              style={{ filter: "invert(1) brightness(1.2) drop-shadow(0 0 6px rgba(167,139,250,0.55))" }}
            />
          </span>
          <div className="flex items-baseline gap-2.5">
            <span className="font-sans text-base font-bold tracking-tight text-white">CORAL</span>
            <span className="hidden sm:inline-block font-mono text-[10px] text-slate-400 tracking-[0.22em] uppercase border-l border-white/10 pl-2.5">
              Urdu ASR · v2
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 glass rounded-full px-1.5 py-1.5">
          {LINKS.map(l => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative px-4 py-1.5 rounded-full font-mono text-[11px] tracking-widest uppercase transition-all ${
                  active
                    ? "text-white bg-white/10"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-0 rounded-full grad-aurora opacity-20 -z-10" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/app"
            className="hidden sm:inline-flex items-center gap-2 rounded-full grad-coral text-white px-4 py-2 font-mono text-[11px] tracking-widest uppercase font-semibold transition-all hover:shadow-[0_0_24px_rgba(255,107,107,0.5)] hover:-translate-y-0.5"
          >
            <span className="relative inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </span>
            Live Demo
          </Link>

          <button
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle navigation"
            className="md:hidden p-2 rounded-lg glass text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6 18 18 M18 6 6 18"/> : <path d="M4 7h16 M4 12h16 M4 17h16"/>}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 glass-strong">
          <div className="mx-auto max-w-7xl px-6 py-3 flex flex-col gap-1">
            {LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2.5 rounded-lg font-mono text-sm tracking-widest uppercase ${
                  pathname === l.href
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/app" className="mt-2 inline-flex items-center justify-center gap-2 rounded-full grad-coral text-white px-4 py-2.5 font-mono text-xs tracking-widest uppercase font-semibold">
              Live Demo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
