import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-white/10">
      <div className="absolute inset-0 -z-10 noise-bg opacity-50" />
      <div className="absolute inset-0 -z-10 dots-bg opacity-20" />

      <div className="mx-auto max-w-7xl px-6 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">

          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3 mb-5">
              <span className="relative inline-flex items-center justify-center w-11 h-11">
                <span className="absolute inset-0 rounded-xl grad-aurora opacity-80" />
                <span className="absolute inset-[2px] rounded-[10px] bg-slate-950" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/coral-logo.png"
                  alt="CORAL"
                  className="relative w-8 h-8 object-contain"
                  style={{ filter: "invert(1) brightness(1.2) drop-shadow(0 0 6px rgba(167,139,250,0.55))" }}
                />
              </span>
              <span className="font-sans text-lg font-bold tracking-tight text-white">CORAL</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-300 max-w-md">
              Consensus-Based Refinement and Output Realignment.
              A research-grade five-stage post-processing pipeline that turns a noisy ensemble of
              speech recognisers into a clean Urdu transcript — no acoustic-model retraining required.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/app" className="inline-flex items-center gap-2 rounded-full grad-coral text-white px-4 py-2 text-xs font-mono tracking-widest uppercase font-semibold transition-shadow hover:shadow-[0_0_24px_rgba(255,107,107,0.5)]">
                Try Demo
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14 M13 5l7 7-7 7"/></svg>
              </Link>
              <Link href="/research" className="inline-flex items-center gap-2 rounded-full border border-white/10 text-white px-4 py-2 text-xs font-mono tracking-widest uppercase hover:bg-white/5">
                Research
              </Link>
            </div>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-4">Product</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/pipeline"  className="text-slate-300 hover:text-white transition-colors">Pipeline</Link></li>
              <li><Link href="/research"  className="text-slate-300 hover:text-white transition-colors">Research</Link></li>
              <li><Link href="/app"       className="text-slate-300 hover:text-white transition-colors">Live Demo</Link></li>
              <li><Link href="/team"      className="text-slate-300 hover:text-white transition-colors">Team</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-4">Resources</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/pipeline#stage-02" className="text-slate-300 hover:text-white transition-colors">API Reference</Link></li>
              <li><Link href="/#architecture"     className="text-slate-300 hover:text-white transition-colors">Architecture Doc</Link></li>
              <li><Link href="/research"          className="text-slate-300 hover:text-white transition-colors">Benchmark TSV</Link></li>
              <li><Link href="/pipeline#stage-02" className="text-slate-300 hover:text-white transition-colors">BK-tree + n-gram corpus</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-4">Institution</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="https://www.nu.edu.pk/Campus/Islamabad" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white transition-colors">
                  FAST-NUCES Islamabad
                </a>
              </li>
              <li><Link href="/team" className="text-slate-300 hover:text-white transition-colors">FAST School of Computing</Link></li>
              <li><Link href="/team" className="text-slate-300 hover:text-white transition-colors">Computer Science · 2026</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-400 font-mono">
            © {year} CORAL Research · Ali Irfan · Nouman Hafeez · Rafay Khattak
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="inline-flex items-center gap-2">
              <span className="relative inline-flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-emerald-500" />
                <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
              </span>
              System operational
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">build · v2.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
