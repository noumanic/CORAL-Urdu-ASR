import Link from "next/link";
import Waveform from "./components/Waveform";
import ParticleField from "./components/ParticleField";
import Counter from "./components/Counter";
import Reveal from "./components/Reveal";
import TechStack from "./components/TechStack";

const STAGES = [
  { n: "00", t: "Normalise",      d: "Arabic→Urdu Unicode unification. Diacritic removal, hamza normalisation. Zero-risk pre-pass that alone contributes 1.9 WER points.",                        c: "amber",  glow: "glow-amber",  grad: "grad-amber"  },
  { n: "01", t: "Split-Merge",    d: "Weighted multi-sequence alignment. Classifies every event as SAME / SPLIT / MERGE / NOISE — 36.5% of all inter-model disagreement.",                       c: "coral",  glow: "glow-coral",  grad: "grad-coral"  },
  { n: "02", t: "OOV + BK-tree",  d: "Hybrid OOV detection with BK-tree edit-distance neighbours re-ranked by an Urdu n-gram language model over a 500K-token corpus.",                          c: "cyan",   glow: "glow-cyan",   grad: "grad-cyan"   },
  { n: "03", t: "Vote",           d: "Position-wise conservative consensus voting across the ensemble. Source-biased tie-breaking, OOV-aware overrides.",                                          c: "violet", glow: "glow-violet", grad: "grad-violet" },
  { n: "04", t: "LLM Refine",     d: "Bounded LLM polish for grammar, izafat, postpositions and code-switching. Hallucinations structurally constrained by upstream metadata.",                  c: "mint",   glow: "glow-cyan",   grad: "grad-mint"   },
];

const READ_SPEECH = [
  { m: "Seamless-Large",   b: 18.45, c: 14.34, d: 22.3 },
  { m: "Whisper-Large-v3", b: 28.29, c: 19.97, d: 29.4 },
  { m: "Whisper-Medium",   b: 40.44, c: 30.64, d: 24.2 },
  { m: "Wav2Vec2-Urdu",    b: 53.52, c: 39.67, d: 25.9 },
];

const PROBLEM = [
  { k: "230M+",  v: "Urdu speakers worldwide", c: "text-rose-400"  },
  { k: "13–20%", v: "WER for current SOTA",    c: "text-amber-400"  },
  { k: "36.5%",  v: "Split/merge disagreement",c: "text-violet-400" },
  { k: "0",      v: "Public correction layers",c: "text-cyan-400"   },
];

const INNOVATIONS = [
  { t: "Split-merge-aware alignment",     d: "First Urdu post-processor to treat word-boundary disagreement as a first-class signal rather than substitution noise.", c: "coral"  },
  { t: "Urdu-specific normalisation",     d: "Custom Arabic↔Urdu Unicode collapse table validated against the Common Voice reference set.",                         c: "amber"  },
  { t: "Hybrid BK-tree + n-gram",         d: "Edit-distance retrieval, then context-aware re-ranking — the OOV long tail solved with classical NLP.",              c: "cyan"   },
  { t: "Conservative consensus voting",   d: "Avoids the ROVER failure mode where high-WER companions overrule a low-WER source.",                                 c: "violet" },
  { t: "Bounded LLM refinement",          d: "The LLM stage runs under authority limits derived from upstream metadata — refines, never rewrites freely.",         c: "mint"   },
  { t: "Frozen acoustic models",          d: "Plug any open-weight ASR ensemble in. CORAL is a deterministic post-processor; the acoustic models stay swappable.",  c: "rose"   },
];

const IMPACT = [
  { t: "Accessibility", d: "Caption Urdu video, broadcast, and lectures with usable accuracy for the deaf and hard-of-hearing community." },
  { t: "Healthcare",    d: "Dictation assistance in Urdu-speaking clinics where patients describe symptoms in dialectal speech." },
  { t: "Education",     d: "Searchable transcripts of Urdu lecture archives — currently unindexable by modern engines." },
  { t: "Legal",         d: "Court and parliamentary record transcription where named-entity precision and code-switching matter." },
  { t: "Low-resource",  d: "Architecture transfers to Pashto, Sindhi, Punjabi — Stages 1-4 are not Urdu-specific." },
  { t: "Open release",  d: "Code, corpus, BK-tree, and benchmark TSV released under permissive licences for downstream research." },
];

function ColorClasses(c: string) {
  switch (c) {
    case "coral":  return { ring: "ring-rose-400/40",   text: "text-rose-400",  bg: "bg-rose-500/10" };
    case "cyan":   return { ring: "ring-cyan-400/40",   text: "text-cyan-400",   bg: "bg-cyan-500/10" };
    case "violet": return { ring: "ring-violet-400/40", text: "text-violet-400", bg: "bg-violet-500/10" };
    case "amber":  return { ring: "ring-amber-400/40",  text: "text-amber-400",  bg: "bg-amber-500/10" };
    case "mint":   return { ring: "ring-emerald-400/40",text: "text-emerald-400",   bg: "bg-emerald-500/10" };
    case "rose":   return { ring: "ring-pink-400/40",   text: "text-pink-400",   bg: "bg-pink-500/10" };
    default:       return { ring: "ring-white/10",      text: "text-white",           bg: "bg-white/5" };
  }
}

export default function Landing() {
  return (
    <div className="overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════════════════
            HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative isolate min-h-[100vh] flex items-center pt-24 pb-20">
        <div className="absolute inset-0 -z-10 grid-bg" />
        <div className="absolute inset-0 -z-10 noise-bg" />
        <div className="aurora-blob -z-10 top-[8%] left-[5%]  w-[420px] h-[420px] grad-violet  animate-aurora" />
        <div className="aurora-blob -z-10 top-[10%] right-[5%] w-[480px] h-[480px] grad-cyan    animate-aurora" style={{ animationDelay: "4s" }} />
        <div className="aurora-blob -z-10 bottom-[5%] left-[40%] w-[440px] h-[440px] grad-coral animate-aurora" style={{ animationDelay: "8s" }} />
        <ParticleField count={50} />

        <div className="relative mx-auto max-w-7xl px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            <div className="lg:col-span-7">

              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-7 animate-fadeUp">
                <span className="relative inline-flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full bg-emerald-500" />
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
                </span>
                <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-300">
                  Research Preview · FAST-NUCES · 2026
                </span>
              </div>

              <h1 className="font-sans text-[clamp(2.5rem,6vw,5.5rem)] font-extrabold tracking-[-0.03em] leading-[1.02] text-white animate-fadeUp" style={{ animationDelay: "0.05s" }}>
                The <span className="grad-text-aurora">consensus layer</span><br />
                for Urdu speech recognition.
              </h1>

              <p className="mt-7 max-w-2xl text-lg text-slate-300 leading-relaxed animate-fadeUp" style={{ animationDelay: "0.15s" }}>
                CORAL is a five-stage post-processing pipeline that takes noisy outputs from a fleet
                of ASR back-ends and produces a single clean Urdu transcript — cutting word-error rate
                by up to <span className="font-semibold text-white">46.5% relative</span>, with no
                fine-tuning of any acoustic model.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row gap-3 animate-fadeUp" style={{ animationDelay: "0.25s" }}>
                <Link
                  href="/app"
                  className="group inline-flex items-center justify-center gap-2 rounded-full grad-coral text-white px-7 py-4 font-mono text-xs tracking-widest uppercase font-semibold shadow-[0_0_32px_rgba(255,107,107,0.35)] hover:shadow-[0_0_48px_rgba(255,107,107,0.6)] hover:-translate-y-0.5 transition-all"
                >
                  Try Live Demo
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-0.5 transition-transform">
                    <path d="M5 12h14 M13 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link
                  href="/research"
                  className="inline-flex items-center justify-center gap-2 rounded-full glass text-white px-7 py-4 font-mono text-xs tracking-widest uppercase font-semibold hover:bg-white/10 transition-all"
                >
                  Explore Research
                </Link>
                <Link
                  href="#architecture"
                  className="inline-flex items-center justify-center gap-2 rounded-full text-slate-300 px-4 py-4 font-mono text-xs tracking-widest uppercase font-semibold hover:text-white transition-all"
                >
                  View Architecture →
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-6 animate-fadeUp" style={{ animationDelay: "0.35s" }}>
                <div>
                  <div className="font-sans text-4xl font-bold text-white animate-counter">
                    <Counter to={46.5} decimals={1} suffix="%" />
                  </div>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400">Relative WER drop</p>
                </div>
                <div>
                  <div className="font-sans text-4xl font-bold text-white">
                    <Counter to={5} />
                  </div>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400">Pipeline stages</p>
                </div>
                <div>
                  <div className="font-sans text-4xl font-bold text-white">
                    <Counter to={10.6} decimals={1} suffix="%" />
                  </div>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.22em] uppercase text-slate-400">Final WER</p>
                </div>
              </div>
            </div>

            {/* RIGHT — Live transcript preview */}
            <div className="lg:col-span-5">
              <div className="relative gradient-border p-1 animate-fadeInScale" style={{ animationDelay: "0.4s" }}>
                <div className="relative rounded-[15px] bg-slate-900 p-6 overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full grad-violet opacity-30 blur-3xl pointer-events-none" />

                  <div className="relative flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <span className="relative inline-flex w-2 h-2">
                        <span className="absolute inset-0 rounded-full bg-rose-500" />
                        <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-70" />
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-slate-300">Live · pipeline.run</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">stage 04 · refining…</span>
                  </div>

                  {/* waveform */}
                  <Waveform bars={48} className="mb-5" />

                  {/* model rows */}
                  <div className="space-y-2.5">
                    {[
                      { m: "whisper-large",  t: "زندگی میں مشکل آتی ہے", conf: 0.81, c: "var(--cyan)"   },
                      { m: "seamless-large", t: "زندگی میں مشکلیں آتی ہیں", conf: 0.92, c: "var(--mint)"   },
                      { m: "wav2vec2-urdu",  t: "زندگی میں مشکل آتی ہیں", conf: 0.63, c: "var(--amber)"  },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2 animate-slideRight" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                        <span className="font-mono text-[9px] tracking-widest uppercase w-24 shrink-0" style={{ color: r.c }}>{r.m}</span>
                        <span dir="rtl" className="font-urdu flex-1 text-right text-[15px] text-slate-100">{r.t}</span>
                        <span className="font-mono text-[10px] text-slate-400 tabular-nums w-8 text-right">{r.conf.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl gradient-border p-px">
                    <div className="rounded-[11px] bg-gradient-to-br from-rose-500/10 to-violet-500/10 px-4 py-3 flex items-center gap-3">
                      <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rose-400 shrink-0">CORAL</span>
                      <span dir="rtl" className="font-urdu flex-1 text-right text-[17px] text-white font-semibold">
                        زندگی میں مشکلیں آتی ہیں
                      </span>
                      <span className="w-0.5 h-4 bg-white animate-blink" />
                    </div>
                  </div>

                  <p className="mt-3 font-mono text-[10px] text-slate-400">
                    ✓ Stage 1 split-merge resolved 1 token · ✓ Stage 3 voted 2 corrections · ✓ Stage 4 grammar pass
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fadeIn" style={{ animationDelay: "1.2s" }}>
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-slate-400">scroll</span>
          <span className="w-px h-10 bg-gradient-to-b from-slate-400 to-transparent" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
            THE PROBLEM
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-rose-400 mb-4">— The Problem</p>
            <h2 className="font-sans text-[clamp(2rem,5vw,3.75rem)] font-extrabold tracking-tight leading-tight text-white max-w-3xl">
              Urdu is the world&apos;s most under-served<br />
              <span className="grad-text-aurora">major spoken language.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-slate-300 leading-relaxed">
              Despite 230M+ speakers, every off-the-shelf ASR model leaks measurable accuracy on Urdu —
              and the dominant failure modes are systematic, not random.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
            {PROBLEM.map((p, i) => (
              <div key={i} className="card card-hover p-7">
                <p className={`font-sans text-5xl font-extrabold tracking-tight ${p.c}`}>{p.k}</p>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">{p.v}</p>
              </div>
            ))}
          </div>

          <Reveal delay={150} className="mt-14">
            <div className="card p-8 sm:p-10">
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-5">— example: tokenisation failure</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="rounded-xl bg-white/[0.03] p-5 border border-white/10">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-rose-300 mb-3">whisper-large says</p>
                  <p dir="rtl" className="font-urdu text-xl text-right text-slate-300">
                    وہ <span className="text-rose-400 line-through decoration-rose-500">کیاہے</span> کام
                  </p>
                  <p className="mt-2 font-mono text-[10px] text-slate-400">tokens: 3 · ‘kya-hai’ merged</p>
                </div>

                <div className="rounded-xl bg-white/[0.03] p-5 border border-white/10">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-cyan-300 mb-3">seamless-large says</p>
                  <p dir="rtl" className="font-urdu text-xl text-right text-slate-300">
                    وہ <span className="text-cyan-300">کیا ہے</span> کام
                  </p>
                  <p className="mt-2 font-mono text-[10px] text-slate-400">tokens: 4 · ‘kya hai’ split</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <span className="font-mono text-[10px] tracking-widest uppercase text-rose-400 shrink-0">CORAL resolves</span>
                <span className="flex-1 h-px bg-gradient-to-r from-rose-500 to-transparent" />
                <span dir="rtl" className="font-urdu text-xl text-emerald-400 font-semibold">وہ کیا ہے کام</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
            HYPOTHESIS / FIVE LEVERS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-violet-400 mb-4">— Research Hypothesis</p>
            <h2 className="font-sans text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-tight leading-tight text-white max-w-4xl">
              Five algorithmic levers,<br />
              <span className="grad-text-cool">composable, deterministic.</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 stagger">
            {STAGES.map((s, i) => {
              const c = ColorClasses(s.c);
              return (
                <div key={i} className="group relative card card-hover p-6 overflow-hidden">
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${s.grad} opacity-20 blur-2xl group-hover:opacity-50 transition-opacity duration-500`} />
                  <div className={`relative inline-flex items-center gap-2 rounded-full ${c.bg} ${c.text} ring-1 ${c.ring} px-2.5 py-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace("text-", "bg-")}`} />
                    <span className="font-mono text-[10px] tracking-widest font-semibold">STAGE {s.n}</span>
                  </div>
                  <h3 className="relative mt-4 font-sans text-xl font-bold text-white tracking-tight">{s.t}</h3>
                  <p className="relative mt-2.5 text-sm text-slate-300 leading-relaxed">{s.d}</p>
                  <div className="relative mt-5 flex items-center justify-between font-mono text-[10px] tracking-widest text-slate-400 uppercase">
                    <span>{i < STAGES.length - 1 ? `→ ${STAGES[i + 1].t}` : "→ Output"}</span>
                    <span className="opacity-60">{(i + 1).toString().padStart(2, "0")}/{STAGES.length.toString().padStart(2, "0")}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <Reveal delay={100} className="mt-10 text-center">
            <Link href="/pipeline" className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-white border-b border-white/30 hover:border-white pb-1 transition-colors">
              Walk through every stage
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14 M13 5l7 7-7 7"/></svg>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
            INTERACTIVE PIPELINE FLOW
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-cyan-400 mb-4">— End-to-End Flow</p>
              <h2 className="font-sans text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-tight leading-tight text-white">
                Raw ensemble → <span className="grad-text-aurora">clean transcript.</span>
              </h2>
            </div>
          </Reveal>

          <Reveal>
            <div className="relative gradient-border p-px overflow-hidden">
              <div className="rounded-[15px] bg-slate-900 p-8 sm:p-10 overflow-hidden">
                <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

                <div className="relative flex flex-col lg:flex-row items-stretch gap-3 lg:gap-2 overflow-x-auto pb-2">

                  <div className="flex-1 min-w-[140px] rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-5 text-center">
                    <p className="font-mono text-[10px] tracking-widest uppercase text-slate-400 mb-2">Input</p>
                    <p className="font-mono text-sm text-white">Ensemble<br />outputs</p>
                  </div>

                  {STAGES.map((s, i) => {
                    const c = ColorClasses(s.c);
                    return (
                      <div key={i} className="flex items-stretch gap-2">
                        <div className="hidden lg:flex items-center text-slate-400">
                          <svg width="24" height="20" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M2 10h16 M14 4l6 6-6 6" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div className={`flex-1 min-w-[140px] rounded-2xl ${c.bg} border border-white/10 ring-1 ${c.ring} p-5 text-center card-hover relative overflow-hidden`}>
                          <div className={`absolute inset-0 ${s.grad} opacity-0 hover:opacity-15 transition-opacity`} />
                          <p className={`relative font-mono text-[10px] tracking-widest uppercase ${c.text} font-semibold mb-2`}>Stage {s.n}</p>
                          <p className="relative font-sans text-sm font-bold text-white">{s.t}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="hidden lg:flex items-center text-slate-400">
                    <svg width="24" height="20" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 10h16 M14 4l6 6-6 6" strokeLinecap="round"/>
                    </svg>
                  </div>

                  <div className="flex-1 min-w-[140px] rounded-2xl grad-coral text-white p-5 text-center glow-coral">
                    <p className="font-mono text-[10px] tracking-widest uppercase text-white/85 mb-2">Output</p>
                    <p className="font-mono text-sm font-semibold">Corrected<br />transcript</p>
                  </div>
                </div>

                {/* Flow timeline labels */}
                <div className="relative mt-8 grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {STAGES.map((s, i) => (
                    <div key={i} className="text-center" style={{ animation: `fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) ${0.1 * i}s both` }}>
                      <p className="font-mono text-[9px] tracking-widest uppercase text-slate-400 mb-1">{i === 0 ? "0 ms" : i === 1 ? "+18 ms" : i === 2 ? "+62 ms" : i === 3 ? "+12 ms" : "+1.4 s"}</p>
                      <p className="font-mono text-[10px] text-slate-300">{s.t}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
            RESULTS DASHBOARD
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end mb-14">
            <Reveal as="div" className="lg:col-span-5">
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-rose-400 mb-4">— Results</p>
              <h2 className="font-sans text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-tight leading-tight text-white">
                The numbers, <span className="grad-text-aurora">unambiguous.</span>
              </h2>
            </Reveal>
            <Reveal as="div" className="lg:col-span-7" delay={120}>
              <p className="text-slate-300 leading-relaxed max-w-2xl">
                Evaluated on 2,995-utterance Common Voice Urdu (read-speech) and a 500-clip
                conversational benchmark. Every CORAL stage adds measurable WER reduction.
              </p>
            </Reveal>
          </div>

          <Reveal>
            <div className="card p-8 sm:p-10">
              <div className="flex items-center justify-between mb-6">
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-400">Common Voice Urdu · n = 2,995 · robust config</p>
                <span className="font-mono text-[10px] text-slate-400">↓ relative</span>
              </div>

              <div className="space-y-4">
                {READ_SPEECH.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 sm:gap-4" style={{ animation: `slideRight 0.8s cubic-bezier(0.16,1,0.3,1) ${0.1 * i}s both` }}>
                    <span className="w-32 sm:w-40 font-mono text-xs text-white truncate">{r.m}</span>
                    <span className="hidden sm:inline w-16 text-right font-mono text-sm text-slate-400 line-through tabular-nums">{r.b.toFixed(2)}%</span>
                    <div className="flex-1 relative h-7 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 grad-coral rounded-full"
                        style={{ width: `${100 - (r.c / r.b) * 100}%`, animation: `fadeIn 1s ease ${0.15 * i + 0.4}s both` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-3">
                        <span className="font-mono text-xs font-bold text-white tabular-nums">{r.c.toFixed(2)}%</span>
                      </div>
                    </div>
                    <span className="w-14 text-right font-mono text-xs px-2 py-1 rounded-full bg-rose-500/15 text-rose-400 ring-1 ring-rose-400/30 tabular-nums">
                      ↓{r.d.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-6">
                {[
                  { v: 22.3, k: "Seamless · CV" },
                  { v: 29.4, k: "Whisper-Large · CV" },
                  { v: 46.5, k: "Whisper-Large · Conversational" },
                ].map((d, i) => (
                  <div key={i}>
                    <p className="font-sans text-3xl font-extrabold grad-text-aurora">
                      <Counter to={d.v} decimals={1} suffix="%" />
                    </p>
                    <p className="font-mono text-[10px] tracking-widest text-slate-400 mt-1 uppercase">{d.k}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={150} className="mt-8">
            <Link href="/research" className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-white border-b border-white/30 hover:border-white pb-1 transition-colors">
              Full ablation, residuals, future work
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14 M13 5l7 7-7 7"/></svg>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
            SYSTEM ARCHITECTURE
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="architecture" className="relative py-28 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-cyan-400 mb-4">— System Architecture</p>
            <h2 className="font-sans text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-tight leading-tight text-white max-w-3xl">
              Distributed inference, <span className="grad-text-aurora">serverless brain.</span>
            </h2>
          </Reveal>

          <Reveal delay={120} className="mt-14">
            <div className="gradient-border p-px">
              <div className="rounded-[15px] bg-slate-900 p-8 sm:p-12 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* INFERENCE TIER */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulseSoft" />
                      <p className="font-mono text-[10px] tracking-widest uppercase text-cyan-400">Inference Tier</p>
                    </div>
                    <p className="font-sans text-lg font-bold text-white mb-1">Kaggle GPU nodes</p>
                    <p className="font-mono text-[10px] text-slate-400 mb-5">3× T4 · ngrok HTTPS tunnels</p>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"/>Whisper-Large-v3</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"/>Seamless-M4T-Large</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"/>Wav2Vec2-Urdu</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"/>Self-registering on boot</li>
                    </ul>
                  </div>

                  {/* BACKEND TIER */}
                  <div className="rounded-2xl gradient-border-bright border border-white/10 p-px">
                    <div className="rounded-[15px] bg-white/[0.025] p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulseSoft" />
                        <p className="font-mono text-[10px] tracking-widest uppercase text-rose-400">Backend Tier</p>
                      </div>
                      <p className="font-sans text-lg font-bold text-white mb-1">FastAPI orchestrator</p>
                      <p className="font-mono text-[10px] text-slate-400 mb-5">HF Space · Docker · port 7860</p>
                      <ul className="space-y-2 text-xs text-slate-300">
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"/>POST /align</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"/>POST /oov</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"/>POST /correct</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"/>Model registry · transcribe</li>
                      </ul>
                    </div>
                  </div>

                  {/* FRONTEND TIER */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulseSoft" />
                      <p className="font-mono text-[10px] tracking-widest uppercase text-violet-400">Frontend Tier</p>
                    </div>
                    <p className="font-sans text-lg font-bold text-white mb-1">Next.js · React 19</p>
                    <p className="font-mono text-[10px] text-slate-400 mb-5">Vercel · client-side LLM</p>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-violet-500"/>4-pass UX flow</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-violet-500"/>Live alignment viz</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-violet-500"/>Stage 4 LLM dispatch</li>
                      <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-violet-500"/>Microphone + file modes</li>
                    </ul>
                  </div>
                </div>

                {/* DATA TIER */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulseSoft" />
                    <p className="font-mono text-[10px] tracking-widest uppercase text-amber-400">Data Tier</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
                      <p className="font-mono text-[10px] text-slate-400">DuckDB</p>
                      <p className="text-slate-300 mt-1">N-gram store · 10.5M rows</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
                      <p className="font-mono text-[10px] text-slate-400">BK-tree</p>
                      <p className="text-slate-300 mt-1">28 MB · joblib pickle</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
                      <p className="font-mono text-[10px] text-slate-400">HuggingFace</p>
                      <p className="text-slate-300 mt-1">Corpus + benchmark TSV</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
                      <p className="font-mono text-[10px] text-slate-400">Eval TSV</p>
                      <p className="text-slate-300 mt-1">Per-stage WER/CER</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
            INNOVATIONS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-violet-400 mb-4">— Research Innovations</p>
            <h2 className="font-sans text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-tight leading-tight text-white max-w-3xl">
              What makes CORAL <span className="grad-text-aurora">not just another wrapper.</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {INNOVATIONS.map((f, i) => {
              const c = ColorClasses(f.c);
              return (
                <div key={i} className="card card-hover p-7">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${c.bg} ring-1 ${c.ring} mb-5 font-sans text-xl ${c.text} font-bold`}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="font-sans text-lg font-bold text-white tracking-tight mb-2.5">{f.t}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{f.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
            TECH STACK
      ══════════════════════════════════════════════════════════════════════ */}
      <TechStack />

      {/* ══════════════════════════════════════════════════════════════════════
            GLOBAL IMPACT
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-emerald-400 mb-4">— Global Impact</p>
            <h2 className="font-sans text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-tight leading-tight text-white max-w-3xl">
              Speech accessibility for the <span className="grad-text-aurora">next billion.</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
            {IMPACT.map((m, i) => (
              <div key={i} className="card card-hover p-7">
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-emerald-400 mb-3">{String(i + 1).padStart(2, "0")} · {m.t}</p>
                <p className="text-sm text-slate-300 leading-relaxed">{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
            FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-28">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="relative overflow-hidden gradient-border-bright gradient-border p-px">
              <div className="relative rounded-[15px] bg-slate-900 p-12 sm:p-16 text-center overflow-hidden">
                <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full grad-coral opacity-25 blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full grad-cyan opacity-20 blur-3xl" />
                <ParticleField count={25} />

                <p className="relative font-mono text-[10px] tracking-[0.3em] uppercase text-rose-400 mb-4">— Try It Now</p>
                <h2 className="relative font-sans text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-tight leading-tight text-white">
                  Drop in audio.<br />
                  <span className="grad-text-aurora">Watch CORAL clean it.</span>
                </h2>
                <p className="relative mt-5 text-slate-300 max-w-xl mx-auto">
                  The interactive demo walks you through every stage with real-time alignment visualisation —
                  microphone, file upload, or pre-aligned TSV.
                </p>
                <div className="relative mt-9 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/app"
                    className="group inline-flex items-center justify-center gap-2 rounded-full grad-coral text-white px-7 py-4 font-mono text-xs tracking-widest uppercase font-semibold shadow-[0_0_32px_rgba(255,107,107,0.45)] hover:shadow-[0_0_56px_rgba(255,107,107,0.65)] hover:-translate-y-0.5 transition-all"
                  >
                    Launch the Pipeline
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-0.5 transition-transform"><path d="M5 12h14 M13 5l7 7-7 7"/></svg>
                  </Link>
                  <Link
                    href="/research"
                    className="inline-flex items-center justify-center gap-2 rounded-full glass text-white px-7 py-4 font-mono text-xs tracking-widest uppercase font-semibold hover:bg-white/10 transition-all"
                  >
                    Read the Research
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
