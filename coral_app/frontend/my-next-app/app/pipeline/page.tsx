import Link from "next/link";
import Reveal from "../components/Reveal";
import ParticleField from "../components/ParticleField";

interface Stage {
  n:        string;
  t:        string;
  tagline:  string;
  what:     string;
  why:      string;
  bullets:  string[];
  metric:   { v: string; k: string };
  example:  { from: string; to: string };
  color:    "amber" | "coral" | "cyan" | "violet" | "mint";
}

const STAGES: Stage[] = [
  {
    n: "00", t: "Urdu Normalisation", tagline: "Zero-risk Unicode unification",
    what: "Stage 0 collapses Arabic-form code-points onto canonical Urdu, strips combining diacritics, harmonises hamza placement, removes tatweel, and normalises punctuation.",
    why:  "A substantial fraction of apparent ASR errors aren't recognition failures — they are measurement artefacts caused by Arabic↔Urdu Unicode variants on either side of the comparison.",
    bullets: ["Arabic Yeh ي → Urdu Yeh ی", "Arabic Kaf ك → Urdu Kaf ک", "Strip ZWJ + Shadda + Tatweel", "Normalise whitespace + punct"],
    metric: { v: "1.9", k: "WER pts (ablation)" },
    example: { from: "كيا حال هے؟", to: "کیا حال ہے" },
    color: "amber",
  },
  {
    n: "01", t: "Split-Merge Alignment", tagline: "Word boundaries as first-class data",
    what: "Stage 1 performs source-anchored weighted Levenshtein alignment across every companion model. Each chunk is tagged SAME, SPLIT (1→n), MERGE (n→1) or NOISE.",
    why:  "SPLIT and MERGE together are 36.5% of all inter-model events. ROVER-style fusion misreads them as substitutions and corrupts the voting signal downstream.",
    bullets: ["Source-anchored Levenshtein", "Per-chunk: SAME/SPLIT/MERGE/NOISE", "Info tags: MATCH/INS/DEL/SUB", "Raw + normalised attempts preserved"],
    metric: { v: "36.5%", k: "of events are SPLIT/MERGE" },
    example: { from: "کیاہے کام", to: "کیا ہے کام" },
    color: "coral",
  },
  {
    n: "02", t: "OOV + BK-tree Lookup", tagline: "Hybrid out-of-vocabulary correction",
    what: "Stage 2 detects tokens absent from the curated Urdu lexicon, queries a BK-tree for edit-distance neighbours, and re-ranks candidates by an n-gram language model conditioned on local context.",
    why:  "Pure edit-distance over-corrects (every misspelling looks like a typo); pure n-gram is under-determined. The combination is robust to dialect, named entities, and code-switched English.",
    bullets: ["BK-tree over 500K-token corpus", "Top-K candidates ranked by LM+edit", "Frequency cut-off + depth tunable", "Returns full candidate metadata"],
    metric: { v: "500K", k: "lexicon tokens" },
    example: { from: "بازر", to: "بازار" },
    color: "cyan",
  },
  {
    n: "03", t: "Consensus Voting", tagline: "Conservative ensemble fusion",
    what: "Stage 3 walks the alignment column-by-column. For each position the source is preserved unless companion models reach a decisive consensus against it, at which point the OOV map is consulted.",
    why:  "Naive majority voting destroys signal when high-WER companions outvote a low-WER source — the classic ROVER failure. CORAL gives the source the benefit of the doubt.",
    bullets: ["Position-wise tally over ensemble", "Source-bias: ties favour source", "OOV-aware overrides", "Position-level diff emitted"],
    metric: { v: "Deterministic", k: "no model in the loop" },
    example: { from: "آیا ہے", to: "آئی ہیں" },
    color: "violet",
  },
  {
    n: "04", t: "LLM Refinement", tagline: "Grammar pass with bounded authority",
    what: "Stage 4 sends the voted output plus structured upstream metadata to a chat-tuned LLM acting as an Urdu linguist. It can fix gender, izafat, postpositions, conjugation — but cannot freely rewrite.",
    why:  "Some classes of error are beyond the reach of lexical alignment: ‘کرتا/کرتی/کرتے’ disagreement, missing ‘نے/کو/سے’, dialectal verb forms. The LLM stage closes that gap.",
    bullets: ["System prompt encodes priorities", "Receives confidence-weighted hyp.", "JSON: corrected + reason + changes", "Authority bounded by upstream"],
    metric: { v: "2.5", k: "WER pts (ablation)" },
    example: { from: "بچہ سکول گیا ہیں", to: "بچے سکول گئے ہیں" },
    color: "mint",
  },
];

const COL: Record<string, { txt: string; ring: string; bg: string; grad: string; glow: string }> = {
  amber:  { txt: "text-amber-400",  ring: "ring-amber-400/30",  bg: "bg-amber-500/10",   grad: "grad-amber",  glow: "glow-amber"  },
  coral:  { txt: "text-rose-400",  ring: "ring-rose-400/30",   bg: "bg-rose-500/10",    grad: "grad-coral",  glow: "glow-coral"  },
  cyan:   { txt: "text-cyan-400",   ring: "ring-cyan-400/30",   bg: "bg-cyan-500/10",    grad: "grad-cyan",   glow: "glow-cyan"   },
  violet: { txt: "text-violet-400", ring: "ring-violet-400/30", bg: "bg-violet-500/10",  grad: "grad-violet", glow: "glow-violet" },
  mint:   { txt: "text-emerald-400",   ring: "ring-emerald-400/30",bg: "bg-emerald-500/10", grad: "grad-mint",   glow: "glow-cyan"   },
};

export default function PipelinePage() {
  return (
    <div className="overflow-x-hidden">

      {/* HERO */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
        <div className="aurora-blob -z-10 top-10  right-[10%] w-96 h-96 grad-violet animate-aurora" />
        <div className="aurora-blob -z-10 bottom-0 left-[20%] w-80 h-80 grad-cyan animate-aurora" style={{ animationDelay: "5s" }} />
        <ParticleField count={30} />

        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-rose-400 mb-4">— The Pipeline</p>
            <h1 className="font-sans text-[clamp(2.5rem,6.5vw,5.5rem)] font-extrabold tracking-[-0.03em] leading-[1.02] text-white max-w-5xl">
              Five stages.<br />
              <span className="grad-text-aurora">One class of error each.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg text-slate-300 leading-relaxed">
              CORAL is not a model. It is a chain of deterministic algorithms with a single LLM stage
              at the end — each engineered to neutralise a specific failure mode in Urdu ASR.
            </p>
          </Reveal>

          {/* Stage chips */}
          <Reveal delay={120} className="mt-10">
            <div className="flex flex-wrap gap-2.5">
              {STAGES.map((s) => {
                const c = COL[s.color];
                return (
                  <a key={s.n} href={`#stage-${s.n}`} className={`group inline-flex items-center gap-2 rounded-full ${c.bg} ring-1 ${c.ring} px-3.5 py-1.5 font-mono text-[10px] tracking-widest uppercase font-semibold ${c.txt} hover:scale-105 transition-transform`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.txt.replace("text-", "bg-")}`} />
                    {s.n} · {s.t}
                  </a>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* STAGES */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 space-y-32 pb-24">
          {STAGES.map((s, i) => {
            const c = COL[s.color];
            const reversed = i % 2 === 1;
            return (
              <Reveal key={s.n} as="div" className="scroll-mt-24" delay={50}>
                <div id={`stage-${s.n}`} className={`grid grid-cols-1 lg:grid-cols-12 gap-10 items-start ${reversed ? "lg:[&>*:first-child]:order-2" : ""}`}>

                  {/* Stage card */}
                  <div className="lg:col-span-5">
                    <div className={`relative gradient-border p-px overflow-hidden`}>
                      <div className="relative rounded-[15px] bg-slate-900 p-8 overflow-hidden">
                        <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full ${c.grad} opacity-25 blur-3xl pointer-events-none`} />

                        <div className={`relative inline-flex items-center gap-2 rounded-full ${c.bg} ${c.txt} ring-1 ${c.ring} px-3 py-1.5`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.txt.replace("text-", "bg-")}`} />
                          <span className="font-mono text-[10px] tracking-widest font-semibold uppercase">Stage {s.n}</span>
                        </div>

                        <h2 className="relative mt-5 font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">{s.t}</h2>
                        <p className="relative mt-2 text-slate-300 italic">{s.tagline}</p>

                        <div className="relative mt-7 rounded-2xl bg-white/[0.04] border border-white/10 p-5">
                          <p className="font-mono text-[9px] tracking-widest uppercase text-slate-400 mb-3">Example</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 text-xs">
                              <span className="font-mono text-[9px] tracking-widest uppercase text-rose-400 w-12 shrink-0">before</span>
                              <span dir="rtl" className="font-urdu text-base text-rose-300 line-through decoration-rose-500/60 flex-1 text-right">{s.example.from}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className={`font-mono text-[9px] tracking-widest uppercase ${c.txt} w-12 shrink-0`}>after</span>
                              <span dir="rtl" className={`font-urdu text-base ${c.txt} font-semibold flex-1 text-right`}>{s.example.to}</span>
                            </div>
                          </div>
                        </div>

                        <div className="relative mt-5 inline-flex items-baseline gap-3 rounded-xl bg-white/[0.04] px-5 py-3 border border-white/10">
                          <span className="font-sans text-3xl font-extrabold text-white">{s.metric.v}</span>
                          <span className="font-mono text-[10px] tracking-widest uppercase text-slate-400">{s.metric.k}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Copy */}
                  <div className="lg:col-span-7 space-y-7">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-2">What it does</p>
                      <p className="text-white text-lg leading-relaxed">{s.what}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-2">Why it matters</p>
                      <p className="text-slate-300 leading-relaxed">{s.why}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-3">Mechanism</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 stagger">
                        {s.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-2.5 rounded-xl card px-3.5 py-2.5">
                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${c.txt.replace("text-", "bg-")} shrink-0`} />
                            <span className="text-sm text-white leading-relaxed">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* FLOW DIAGRAM */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="text-center mb-12">
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-cyan-400 mb-3">— End-to-End Flow</p>
              <h2 className="font-sans text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-tight text-white">
                Composable, <span className="grad-text-aurora">deterministic, traceable.</span>
              </h2>
            </div>
          </Reveal>

          <Reveal>
            <div className="relative gradient-border p-px overflow-hidden">
              <div className="rounded-[15px] bg-slate-900 p-8 sm:p-12 overflow-hidden">
                <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

                <div className="relative flex flex-col lg:flex-row items-stretch gap-3 lg:gap-2 overflow-x-auto pb-2 stagger">
                  <div className="flex-1 min-w-[140px] rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-5 text-center">
                    <p className="font-mono text-[10px] tracking-widest uppercase text-slate-400 mb-2">Input</p>
                    <p className="font-mono text-sm text-white">Ensemble<br />outputs</p>
                  </div>

                  {STAGES.map((s, i) => {
                    const c = COL[s.color];
                    return (
                      <div key={i} className="flex items-stretch gap-2">
                        <div className="hidden lg:flex items-center text-slate-400">
                          <svg width="24" height="20" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 10h16 M14 4l6 6-6 6" strokeLinecap="round"/></svg>
                        </div>
                        <div className={`flex-1 min-w-[140px] rounded-2xl ${c.bg} border border-white/10 ring-1 ${c.ring} p-5 text-center card-hover`}>
                          <p className={`font-mono text-[10px] tracking-widest uppercase ${c.txt} font-semibold mb-2`}>Stage {s.n}</p>
                          <p className="font-sans text-sm font-bold text-white">{s.t}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="hidden lg:flex items-center text-slate-400">
                    <svg width="24" height="20" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 10h16 M14 4l6 6-6 6" strokeLinecap="round"/></svg>
                  </div>

                  <div className="flex-1 min-w-[140px] rounded-2xl grad-coral text-white p-5 text-center glow-coral">
                    <p className="font-mono text-[10px] tracking-widest uppercase text-white/85 mb-2">Output</p>
                    <p className="font-mono text-sm font-semibold">Corrected<br />transcript</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <h2 className="font-sans text-4xl font-extrabold tracking-tight text-white">Want to see it move?</h2>
            <p className="mt-4 text-slate-300">The interactive demo lets you step through every stage on your own audio or text.</p>
            <Link href="/app" className="mt-7 inline-flex items-center gap-2 rounded-full grad-coral text-white px-7 py-3.5 font-mono text-xs tracking-widest uppercase font-semibold shadow-[0_0_32px_rgba(255,107,107,0.35)] hover:shadow-[0_0_48px_rgba(255,107,107,0.6)] hover:-translate-y-0.5 transition-all">
              Launch the Demo
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14 M13 5l7 7-7 7"/></svg>
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
