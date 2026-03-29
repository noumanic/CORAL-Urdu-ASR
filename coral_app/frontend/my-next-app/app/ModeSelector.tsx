"use client";

interface Props {
  onSelect: (mode: "file" | "speech") => void;
}

export default function ModeSelector({ onSelect }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">

      {/* grain overlay */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat", backgroundSize: "128px" }}
      />

      {/* logo */}
      <div className="mb-16 flex flex-col items-center gap-3 animate-[fadeUp_0.6s_ease_both]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-sm font-semibold tracking-[0.3em] text-zinc-100 uppercase">CORAL</span>
        </div>
        <p className="font-mono text-xs text-zinc-600 tracking-widest uppercase">Urdu ASR Post-Correction</p>
      </div>

      {/* mode cards */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl animate-[fadeUp_0.6s_0.15s_ease_both_backwards]">

        {/* File */}
        <button
          onClick={() => onSelect("file")}
          className="group flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 flex flex-col items-center gap-5 hover:border-cyan-800 hover:bg-cyan-950/20 transition-all duration-300 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-xl border border-zinc-700 bg-zinc-900 flex items-center justify-center group-hover:border-cyan-800 group-hover:bg-cyan-950/40 transition-all duration-300">
            <svg className="w-7 h-7 text-zinc-500 group-hover:text-cyan-400 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-mono text-sm font-semibold text-zinc-200 tracking-widest uppercase mb-1.5">File</p>
            <p className="font-mono text-xs text-zinc-600">CSV · TSV · JSON</p>
          </div>
          <div className="mt-auto font-mono text-xs text-zinc-700 group-hover:text-cyan-700 transition-colors tracking-widest uppercase">
            Select →
          </div>
        </button>

        {/* Speech */}
        <button
          onClick={() => onSelect("speech")}
          className="group flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 flex flex-col items-center gap-5 hover:border-violet-800 hover:bg-violet-950/20 transition-all duration-300 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-xl border border-zinc-700 bg-zinc-900 flex items-center justify-center group-hover:border-violet-800 group-hover:bg-violet-950/40 transition-all duration-300">
            <svg className="w-7 h-7 text-zinc-500 group-hover:text-violet-400 transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-mono text-sm font-semibold text-zinc-200 tracking-widest uppercase mb-1.5">Speech</p>
            <p className="font-mono text-xs text-zinc-600">MP3 upload · Microphone</p>
          </div>
          <div className="mt-auto font-mono text-xs text-zinc-700 group-hover:text-violet-700 transition-colors tracking-widest uppercase">
            Select →
          </div>
        </button>

      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
