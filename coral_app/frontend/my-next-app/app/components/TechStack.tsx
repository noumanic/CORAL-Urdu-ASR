"use client";
import { ReactNode } from "react";
import Reveal from "./Reveal";

interface Item {
  tag:        string;
  t:          string;
  sub:        string;
  color:      "aurora" | "cyan" | "amber" | "violet" | "coral" | "mint";
  icon:       ReactNode;
}

const COL: Record<Item["color"], { grad: string; ring: string; text: string; glow: string }> = {
  aurora: { grad: "grad-aurora", ring: "ring-violet-400/40", text: "text-violet-300", glow: "shadow-[0_0_24px_rgba(167,139,250,0.35)]" },
  cyan:   { grad: "grad-cyan",   ring: "ring-cyan-400/40",   text: "text-cyan-300",   glow: "shadow-[0_0_24px_rgba(34,211,238,0.35)]"  },
  amber:  { grad: "grad-amber",  ring: "ring-amber-400/40",  text: "text-amber-300",  glow: "shadow-[0_0_24px_rgba(251,191,36,0.35)]"  },
  violet: { grad: "grad-violet", ring: "ring-violet-400/40", text: "text-violet-300", glow: "shadow-[0_0_24px_rgba(167,139,250,0.35)]" },
  coral:  { grad: "grad-coral",  ring: "ring-rose-400/40",   text: "text-rose-300",   glow: "shadow-[0_0_24px_rgba(255,107,107,0.35)]" },
  mint:   { grad: "grad-mint",   ring: "ring-emerald-400/40",text: "text-emerald-300",glow: "shadow-[0_0_24px_rgba(74,222,128,0.35)]"  },
};

/* ─── ICON COMPONENTS ─── */

const NextIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
    <path d="M11 9v14M11 9l9.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M20.5 9v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const FastAPIIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <path d="M17 7L9 18h6l-1 7 8-11h-6l1-7z" fill="currentColor" />
  </svg>
);

const DuckDBIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <path d="M4 18c0-5 4-9 9-9h4c4 0 7 3 7 7v3c0 2-1 3-3 3H10c-3 0-6-2-6-4z" fill="currentColor" />
    <circle cx="20" cy="14" r="1.4" fill="#0a0f1f" />
    <path d="M23 13l5-1-1.5 3-3.5-1z" fill="currentColor" />
  </svg>
);

const HFIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <circle cx="16" cy="16" r="11" fill="currentColor" />
    <circle cx="12" cy="14" r="1.7" fill="#0a0f1f" />
    <circle cx="20" cy="14" r="1.7" fill="#0a0f1f" />
    <path d="M11 19c1.5 2 3 3 5 3s3.5-1 5-3" stroke="#0a0f1f" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <circle cx="9.5" cy="17.5" r="1.6" fill="#ff8a8a" opacity="0.7" />
    <circle cx="22.5" cy="17.5" r="1.6" fill="#ff8a8a" opacity="0.7" />
  </svg>
);

const WhisperIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <rect x="13" y="5" width="6" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9 15c0 4 3 7 7 7s7-3 7-7M16 22v5M12 27h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const SeamlessIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <path
      d="M8 16c0-3 2-5 5-5s4 2 6 5 3 5 6 5 5-2 5-5-2-5-5-5-4 2-6 5-3 5-6 5-5-2-5-5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Wav2VecIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <rect x="3"  y="13" width="2.6" height="6"  rx="1.3" fill="currentColor" className="origin-center" style={{ animation: "wave-bar 1.1s ease-in-out infinite" }} />
    <rect x="8"  y="10" width="2.6" height="12" rx="1.3" fill="currentColor" style={{ animation: "wave-bar 1.3s ease-in-out infinite", animationDelay: "0.1s" }} />
    <rect x="13" y="6"  width="2.6" height="20" rx="1.3" fill="currentColor" style={{ animation: "wave-bar 0.9s ease-in-out infinite", animationDelay: "0.25s" }} />
    <rect x="18" y="9"  width="2.6" height="14" rx="1.3" fill="currentColor" style={{ animation: "wave-bar 1.2s ease-in-out infinite", animationDelay: "0.4s" }} />
    <rect x="23" y="12" width="2.6" height="8"  rx="1.3" fill="currentColor" style={{ animation: "wave-bar 1s   ease-in-out infinite", animationDelay: "0.55s" }} />
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
    <path d="M16 3l2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8z" fill="currentColor" />
    <path d="M24 5l.7 2.3 2.3.7-2.3.7L24 11l-.7-2.3-2.3-.7 2.3-.7L24 5z" fill="currentColor" opacity="0.7" />
    <path d="M7 22l.7 2.3L10 25l-2.3.7L7 28l-.7-2.3L4 25l2.3-.7L7 22z" fill="currentColor" opacity="0.85" />
  </svg>
);

/* ─── DATA ─── */

const ITEMS: Item[] = [
  { tag: "Frontend",    t: "Next.js 15",          sub: "App Router · React 19", color: "aurora", icon: <NextIcon />     },
  { tag: "Backend",     t: "FastAPI",             sub: "Python · async REST",   color: "cyan",   icon: <FastAPIIcon />  },
  { tag: "Storage",     t: "DuckDB",              sub: "10.5M-row n-gram store",color: "amber",  icon: <DuckDBIcon />   },
  { tag: "Datasets",    t: "Hugging Face",        sub: "Models · BK-tree · TSV",color: "violet", icon: <HFIcon />       },
  { tag: "ASR",         t: "Whisper-Large-v3",    sub: "OpenAI · multilingual", color: "coral",  icon: <WhisperIcon />  },
  { tag: "ASR",         t: "Seamless-M4T",        sub: "Meta · low-resource",   color: "cyan",   icon: <SeamlessIcon /> },
  { tag: "ASR",         t: "Wav2Vec2-Urdu",       sub: "Self-supervised · CTC", color: "mint",   icon: <Wav2VecIcon />  },
  { tag: "LLM Refine",  t: "GPT-OSS · Gemini",    sub: "Bounded post-edit",     color: "aurora", icon: <SparkleIcon />  },
];

/* ─── CARD ─── */

function Card({ item }: { item: Item }) {
  const c = COL[item.color];
  return (
    <div className="group relative card card-hover p-6 overflow-hidden">
      {/* gradient orb that grows on hover */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${c.grad} opacity-25 blur-3xl group-hover:opacity-70 group-hover:scale-125 transition-all duration-700`} />

      {/* shimmer sweep on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none">
        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
      </div>

      {/* icon tile */}
      <div className="relative">
        <div className={`relative w-14 h-14 rounded-2xl ring-1 ${c.ring} bg-white/[0.04] flex items-center justify-center ${c.text} ${c.glow} group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500`}>
          {/* orbiting dot */}
          <span className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className={`absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${c.text.replace("text-", "bg-")} shadow-[0_0_8px_currentColor] animate-spinSlow origin-[50%_30px]`} />
          </span>
          {item.icon}
        </div>

        <p className={`mt-5 font-mono text-[10px] tracking-[0.25em] uppercase ${c.text} font-semibold`}>{item.tag}</p>
        <p className="mt-1.5 font-sans text-lg font-bold text-white tracking-tight">{item.t}</p>
        <p className="mt-1 font-mono text-[11px] text-slate-400">{item.sub}</p>

        {/* hover-revealed underline */}
        <div className={`mt-4 h-px w-8 ${c.grad} opacity-60 group-hover:w-full group-hover:opacity-100 transition-all duration-500`} />
      </div>
    </div>
  );
}

/* ─── SECTION ─── */

export default function TechStack() {
  return (
    <section className="relative py-28">
      <div className="absolute inset-0 -z-10 grid-bg opacity-30" />
      <div className="aurora-blob -z-10 top-20  left-[5%]  w-80 h-80 grad-amber  animate-aurora opacity-25" />
      <div className="aurora-blob -z-10 bottom-0 right-[10%] w-96 h-96 grad-violet animate-aurora opacity-25" style={{ animationDelay: "5s" }} />

      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-amber-400 mb-4">— Built With</p>
          <h2 className="font-sans text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-tight leading-tight text-white">
            Open weights. Open stack. <span className="grad-text-aurora">Open data.</span>
          </h2>
          <p className="mt-5 max-w-2xl text-slate-300 leading-relaxed">
            Every layer of CORAL runs on open standards — from the ASR back-ends down to the
            language-model post-edit. No proprietary models in the critical path.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger">
          {ITEMS.map((it, i) => (
            <Card key={i} item={it} />
          ))}
        </div>
      </div>
    </section>
  );
}
