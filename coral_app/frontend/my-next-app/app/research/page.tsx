import Link from "next/link";
import Reveal from "../components/Reveal";
import Counter from "../components/Counter";
import ParticleField from "../components/ParticleField";

const READ_SPEECH = [
  { model: "Seamless-Large",   baseline: 18.45, coral: 14.34, drop: 22.3 },
  { model: "Whisper-Large-v3", baseline: 28.29, coral: 19.97, drop: 29.4 },
  { model: "Whisper-Medium",   baseline: 40.44, coral: 30.64, drop: 24.2 },
  { model: "Wav2Vec2-Urdu",    baseline: 53.52, coral: 39.67, drop: 25.9 },
];

const ABLATION = [
  { c: "C0", desc: "Whisper-Large-v3 baseline",          wer: 19.8,  delta: 0    },
  { c: "C1", desc: "+ Stage 0 normalisation",            wer: 17.9,  delta: -1.9 },
  { c: "C2", desc: "+ Stage 1 split-merge alignment",    wer: 16.4,  delta: -1.5 },
  { c: "C3", desc: "+ Stage 2 BK-tree (top-1)",          wer: 15.1,  delta: -1.3 },
  { c: "C4", desc: "+ Stage 2 n-gram re-ranking",        wer: 14.2,  delta: -0.9 },
  { c: "C5", desc: "+ Stage 3 conservative voting",      wer: 13.6,  delta: -0.6 },
  { c: "C6", desc: "+ ensemble companions",              wer: 13.1,  delta: -0.5 },
  { c: "C7", desc: "+ Stage 4 LLM refinement",           wer: 10.6,  delta: -2.5 },
];

const RESIDUALS = [
  { type: "Proper nouns / named entities",    pct: 27.7, color: "from-rose-400 to-rose-600",       text: "text-rose-300"   },
  { type: "Code-switching (Urdu ↔ English)",  pct: 21.5, color: "from-amber-400 to-amber-600",     text: "text-amber-300"  },
  { type: "Dialectal / colloquial",            pct: 18.4, color: "from-cyan-400 to-cyan-600",       text: "text-cyan-300"   },
  { type: "Phoneme confusion",                 pct: 12.7, color: "from-violet-400 to-violet-600",   text: "text-violet-300" },
  { type: "LLM over-correction",               pct: 7.2,  color: "from-emerald-400 to-emerald-600", text: "text-emerald-300"},
  { type: "Other",                             pct: 12.5, color: "from-slate-400 to-slate-600",     text: "text-slate-300"  },
];

const FUTURE = [
  { n: "01", t: "Confidence-weighted voting",          d: "Replace equal voting weights with model-specific WER priors. Estimated additional 0.3 WER point reduction." },
  { n: "02", t: "Code-switching normalisation",        d: "Preserve English tokens through a bilingual alignment stage instead of stripping ASCII." },
  { n: "03", t: "Named-entity gazetteer",              d: "Secondary BK-tree of toponyms, person, organisation, brand names. Direct hit on the dominant residual error class." },
  { n: "04", t: "LLM-guided top-K OOV re-ranking",     d: "Pass top-3 BK-tree candidates to Stage 4 for context-aware selection — reduces over-correction." },
  { n: "05", t: "Split/merge metadata in voting",      d: "Use SAME/SPLIT/MERGE classification in Stage 3 resolution logic, not just Stage 1 visualisation." },
  { n: "06", t: "Cross-architecture confidence",        d: "Learned TruCLeS-style calibration over heterogeneous acoustic models." },
  { n: "07", t: "Larger conversational evaluation",    d: "Scale beyond 500 clips to thousands of dialect-varied conversational samples." },
  { n: "08", t: "Real-time streaming",                 d: "Operate on partial hypotheses for bounded-latency captioning use cases." },
  { n: "09", t: "Other low-resource languages",        d: "Stages 1-4 transfer directly. Validate on Pashto, Sindhi, Punjabi with replaced corpora." },
  { n: "10", t: "Open release",                        d: "Source code, evaluation TSV, BK-tree, and n-gram corpus under permissive licences." },
];

export default function ResearchPage() {
  return (
    <div className="overflow-x-hidden">

      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
        <div className="aurora-blob -z-10 top-10 left-[5%] w-96 h-96 grad-cyan animate-aurora" />
        <div className="aurora-blob -z-10 top-20 right-[5%] w-80 h-80 grad-coral animate-aurora" style={{ animationDelay: "4s" }} />
        <ParticleField count={28} />

        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-rose-400 mb-4">— Research</p>
            <h1 className="font-sans text-[clamp(2.5rem,6.5vw,5.5rem)] font-extrabold tracking-[-0.03em] leading-[1.02] text-white max-w-5xl">
              Empirical evidence the<br />
              <span className="grad-text-aurora">pipeline works.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg text-slate-300 leading-relaxed">
              Two evaluation suites. Eight ablation configurations. A breakdown of where the remaining
              errors come from — and ten concrete directions for the next iteration.
            </p>
          </Reveal>

          {/* Stat strip */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
            {[
              { v: 46.5, k: "Best relative WER drop", s: "%" },
              { v: 10.6, k: "Final WER · convo",      s: "%" },
              { v: 2995, k: "Read-speech utterances", s: ""  },
              { v: 8,    k: "Ablation configs",       s: ""  },
            ].map((d, i) => (
              <div key={i} className="card card-hover p-6">
                <p className="font-sans text-4xl font-extrabold text-white">
                  <Counter to={d.v} decimals={d.s === "%" ? 1 : 0} suffix={d.s} />
                </p>
                <p className="mt-1 font-mono text-[10px] tracking-widest uppercase text-slate-400">{d.k}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HYPOTHESIS */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <div className="relative gradient-border-bright gradient-border p-px">
              <div className="relative rounded-[15px] bg-slate-900 p-10 overflow-hidden">
                <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full grad-coral opacity-20 blur-3xl" />
                <div className="relative inline-flex items-center gap-2 rounded-full grad-coral text-white px-3 py-1 mb-6 font-mono text-[10px] tracking-widest uppercase font-semibold shadow-[0_0_24px_rgba(255,107,107,0.4)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulseSoft" />
                  Research Hypothesis
                </div>
                <p className="relative text-2xl font-sans text-white leading-relaxed font-medium">
                  <span className="text-4xl text-rose-400 font-bold align-top mr-1">“</span>
                  Combining Urdu-specific Unicode normalisation, weighted split-merge-aware alignment of multiple ASR hypotheses,
                  hybrid OOV detection with BK-tree fuzzy lookup ranked by an n-gram language model, conservative position-wise voting,
                  and targeted LLM refinement
                  <span className="font-bold grad-text-aurora"> is sufficient</span> to substantially reduce WER over the strongest
                  single-model baseline — without fine-tuning any acoustic model.
                  <span className="text-4xl text-rose-400 font-bold ml-1">”</span>
                </p>
                <p className="relative mt-5 font-mono text-xs tracking-widest text-slate-400 uppercase">— Answered affirmatively (§5)</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* READ-SPEECH */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="mb-10">
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-cyan-400 mb-2">— Result 1</p>
              <h2 className="font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-white">Read-speech · Common Voice Urdu</h2>
              <p className="mt-2 text-slate-300">2,995 utterances · robust config · CORAL as post-processor</p>
            </div>
          </Reveal>

          <Reveal>
            <div className="card overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-4 border-b border-white/10 bg-white/[0.02] font-mono text-[10px] tracking-widest uppercase text-slate-400">
                <div className="col-span-4">Source model</div>
                <div className="col-span-2 text-right">Baseline</div>
                <div className="col-span-4 text-center">WER reduction</div>
                <div className="col-span-1 text-right">CORAL</div>
                <div className="col-span-1 text-right">Δ rel</div>
              </div>

              {READ_SPEECH.map((r, i) => (
                <div key={i} className="grid grid-cols-12 px-6 py-5 items-center border-b border-white/10 last:border-0 hover:bg-white/[0.02] transition-colors" style={{ animation: `slideRight 0.8s cubic-bezier(0.16,1,0.3,1) ${0.08 * i}s both` }}>
                  <div className="col-span-4 font-mono text-sm font-semibold text-white">{r.model}</div>
                  <div className="col-span-2 text-right font-mono text-sm text-slate-400 line-through tabular-nums">{r.baseline.toFixed(2)}%</div>
                  <div className="col-span-4 px-4">
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full grad-coral" style={{ width: `${100 - (r.coral / r.baseline) * 100}%`, animation: `fadeIn 1.2s ease ${0.2 + 0.08 * i}s both` }} />
                    </div>
                  </div>
                  <div className="col-span-1 text-right font-mono text-sm font-bold text-white tabular-nums">{r.coral.toFixed(2)}%</div>
                  <div className="col-span-1 text-right">
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 ring-1 ring-rose-400/30 tabular-nums">↓{r.drop.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ABLATION */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="mb-10">
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-violet-400 mb-2">— Result 2</p>
              <h2 className="font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-white">Ablation · C0 → C7</h2>
              <p className="mt-2 text-slate-300">Whisper-Large-v3 source · 500-clip conversational sample · each row adds one component</p>
            </div>
          </Reveal>

          <Reveal>
            <div className="card p-8 sm:p-10">

              <div className="relative mb-8">
                <div className="flex">
                  {/* y-axis labels */}
                  <div className="w-10 h-80 flex flex-col justify-between pointer-events-none">
                    {[20, 15, 10, 5, 0].map((v, i) => (
                      <span key={i} className="font-mono text-[9px] text-slate-400 tabular-nums leading-none">{v}%</span>
                    ))}
                  </div>

                  {/* chart area */}
                  <div className="relative flex-1 h-80">
                    {/* horizontal grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[0, 1, 2, 3, 4].map(i => (
                        <span key={i} className="h-px bg-white/5 w-full" />
                      ))}
                    </div>

                    {/* bars */}
                    <div className="relative h-full flex items-end gap-2 sm:gap-3 px-2">
                      {ABLATION.map((a, i) => {
                        const h = (a.wer / 22) * 100;
                        const isFinal = i === ABLATION.length - 1;
                        return (
                          <div key={i} className="relative flex-1 h-full flex flex-col items-center justify-end group">
                            <span className="font-mono text-[10px] font-bold text-white mb-1 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{a.wer.toFixed(1)}%</span>
                            <div
                              className={`w-full rounded-t-lg relative ${isFinal ? "grad-coral glow-coral" : "bg-gradient-to-t from-violet-500 to-cyan-500"}`}
                              style={{ height: `${h}%`, animation: `fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) ${0.1 * i + 0.2}s both` }}
                            >
                              {isFinal && (
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[11px] font-bold text-rose-400 tabular-nums whitespace-nowrap">{a.wer.toFixed(1)}%</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* x-axis labels */}
                <div className="flex pt-2">
                  <div className="w-10 shrink-0" />
                  <div className="flex-1 flex gap-2 sm:gap-3 px-2">
                    {ABLATION.map((a, i) => (
                      <span key={i} className="flex-1 text-center font-mono text-[10px] tracking-widest text-slate-400">{a.c}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 stagger">
                {ABLATION.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/10 last:border-0">
                    <span className="font-mono text-[10px] tracking-widest font-semibold w-8 text-rose-400">{a.c}</span>
                    <span className="flex-1 text-sm text-white">{a.desc}</span>
                    <span className="font-mono text-xs tabular-nums text-slate-400 w-12 text-right">{a.wer.toFixed(1)}%</span>
                    {a.delta !== 0 ? (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 ring-1 ring-rose-400/30 tabular-nums w-14 text-right">
                        {a.delta > 0 ? "+" : ""}{a.delta.toFixed(1)}
                      </span>
                    ) : <span className="w-14" />}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* COMPARISON BANNER */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="relative gradient-border-bright gradient-border p-px overflow-hidden">
              <div className="relative rounded-[15px] bg-slate-900 p-10 sm:p-14 overflow-hidden">
                <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full grad-coral opacity-25 blur-3xl" />
                <div className="absolute -bottom-12 -left-12 w-72 h-72 rounded-full grad-cyan opacity-20 blur-3xl" />

                <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-rose-400 mb-2">— vs. concurrent work</p>
                    <h3 className="font-sans text-3xl font-extrabold tracking-tight text-white">Beats the closest system.</h3>
                  </div>
                  <div className="lg:col-span-2 grid grid-cols-3 gap-4">
                    {[
                      { name: "ROVER (English-style)",  v: "—",    sub: "fails on Urdu boundaries" },
                      { name: "Multi-ASR + SpeechLLM",  v: "11.3%", sub: "heavy audio inference"   },
                      { name: "CORAL",                  v: "10.6%", sub: "no SpeechLLM at runtime", highlight: true },
                    ].map((c, i) => (
                      <div key={i} className={`rounded-2xl p-5 border ${c.highlight ? "border-rose-400 bg-rose-500/10 glow-coral" : "border-white/10 bg-white/[0.04]"}`} style={{ animation: `fadeInScale 0.8s cubic-bezier(0.16,1,0.3,1) ${0.1 * i}s both` }}>
                        <p className="font-mono text-[10px] tracking-widest uppercase text-slate-400 mb-1.5">{c.name}</p>
                        <p className="font-sans text-3xl font-extrabold text-white tabular-nums">{c.v}</p>
                        <p className="font-mono text-[10px] text-slate-400 mt-1">{c.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* RESIDUALS */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="mb-10">
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-amber-400 mb-2">— Where errors come from now</p>
              <h2 className="font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-white">Residual error breakdown</h2>
              <p className="mt-2 text-slate-300">Manual annotation of the 10.6% remaining WER after Stage 4</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Reveal as="div" className="lg:col-span-7">
              <div className="card p-7 space-y-4">
                {RESIDUALS.map((r, i) => (
                  <div key={i} style={{ animation: `slideRight 0.8s cubic-bezier(0.16,1,0.3,1) ${0.08 * i}s both` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-medium ${r.text}`}>{r.type}</span>
                      <span className="font-mono text-sm font-bold tabular-nums text-white">{r.pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${r.color} rounded-full`} style={{ width: `${r.pct * 2}%`, animation: `fadeIn 1.2s ease ${0.3 + 0.08 * i}s both` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal as="div" className="lg:col-span-5 space-y-4">
              <div className="card p-6">
                <p className="font-mono text-[10px] tracking-widest uppercase text-slate-400 mb-2">Top observation</p>
                <p className="text-white leading-relaxed">
                  Named entities and code-switching together account for <span className="font-bold grad-text-aurora">49.2%</span> of remaining errors —
                  both directly addressable by upgrades in Future Work §3, §2.
                </p>
              </div>
              <div className="card p-6">
                <p className="font-mono text-[10px] tracking-widest uppercase text-slate-400 mb-2">Note</p>
                <p className="text-slate-300 leading-relaxed text-sm">
                  LLM over-correction (7.2%) is the only error class introduced by CORAL itself; everything
                  else is inherited from the acoustic models. Stage 4 authority limits keep this number low.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FUTURE WORK */}
      <section id="future" className="py-20 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="mb-10">
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-emerald-400 mb-2">— What&apos;s next</p>
              <h2 className="font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-white">Future work · ten directions</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
            {FUTURE.map((f, i) => (
              <div key={i} className="group card card-hover p-6">
                <div className="flex items-start gap-4">
                  <span className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.04] ring-1 ring-white/10 group-hover:grad-aurora group-hover:ring-0 font-mono text-xs font-bold text-white transition-all">
                    {f.n}
                  </span>
                  <div>
                    <h4 className="font-sans text-lg font-bold tracking-tight text-white">{f.t}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{f.d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <h2 className="font-sans text-4xl font-extrabold tracking-tight text-white">Read it or run it.</h2>
            <p className="mt-4 text-slate-300">Take the system through your own data, or explore the pipeline mechanics next.</p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/app" className="inline-flex items-center justify-center gap-2 rounded-full grad-coral text-white px-7 py-3.5 font-mono text-xs tracking-widest uppercase font-semibold shadow-[0_0_32px_rgba(255,107,107,0.35)] hover:shadow-[0_0_48px_rgba(255,107,107,0.6)] hover:-translate-y-0.5 transition-all">
                Launch Demo
              </Link>
              <Link href="/pipeline" className="inline-flex items-center justify-center gap-2 rounded-full glass text-white px-7 py-3.5 font-mono text-xs tracking-widest uppercase font-semibold hover:bg-white/10 transition-all">
                Pipeline Detail
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
