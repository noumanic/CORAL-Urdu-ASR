"use client";
import ParticleField from "./components/ParticleField";

interface Props {
  onSelect: (mode: "file" | "speech") => void;
}

export default function ModeSelector({ onSelect }: Props) {
  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 py-20 overflow-hidden">

      <div className="absolute inset-0 -z-10 grid-bg opacity-40" />
      <div className="aurora-blob -z-10 top-10 left-[15%] w-96 h-96 grad-coral animate-aurora" />
      <div className="aurora-blob -z-10 bottom-10 right-[15%] w-96 h-96 grad-cyan  animate-aurora" style={{ animationDelay: "3s" }} />
      <ParticleField count={30} />

      <div className="mb-12 flex flex-col items-center gap-4 animate-fadeUp">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5">
          <span className="relative inline-flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-emerald-500" />
            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
          </span>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-300">Interactive Pipeline · v2</span>
        </div>
        <h1 className="font-sans text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-tight text-white text-center max-w-2xl leading-tight">
          How do you want to <span className="grad-text-aurora">feed CORAL?</span>
        </h1>
        <p className="text-slate-300 text-center max-w-md">
          Pick a pre-aligned transcript file, or speak / upload audio and let our ASR registry handle inference.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-5 w-full max-w-3xl animate-fadeUp" style={{ animationDelay: "0.15s" }}>

        {/* File */}
        <button
          onClick={() => onSelect("file")}
          className="group flex-1 card card-hover p-8 flex flex-col items-start gap-5 text-left hover:ring-1 hover:ring-cyan-400/40 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center group-hover:grad-cyan group-hover:border-transparent transition-all glow-cyan">
            <svg className="w-7 h-7 text-cyan-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <div>
            <p className="font-sans text-2xl font-extrabold text-white tracking-tight">Use a file</p>
            <p className="text-sm text-slate-300 mt-1">Pre-aligned model outputs · CSV · TSV · JSON</p>
          </div>
          <div className="mt-auto pt-2 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase font-semibold text-cyan-400 group-hover:gap-3 transition-all">
            Continue
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14 M13 5l7 7-7 7"/></svg>
          </div>
        </button>

        {/* Speech */}
        <button
          onClick={() => onSelect("speech")}
          className="group flex-1 card card-hover p-8 flex flex-col items-start gap-5 text-left hover:ring-1 hover:ring-violet-400/40 transition-all"
        >
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-400/30 flex items-center justify-center group-hover:grad-violet group-hover:border-transparent transition-all glow-violet">
            <svg className="w-7 h-7 text-violet-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
          <div>
            <p className="font-sans text-2xl font-extrabold text-white tracking-tight">Use speech</p>
            <p className="text-sm text-slate-300 mt-1">MP3 upload or live microphone · ASR registry routes inference</p>
          </div>
          <div className="mt-auto pt-2 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase font-semibold text-violet-400 group-hover:gap-3 transition-all">
            Continue
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14 M13 5l7 7-7 7"/></svg>
          </div>
        </button>
      </div>

    </div>
  );
}
