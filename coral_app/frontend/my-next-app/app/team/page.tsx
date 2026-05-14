import Link from "next/link";
import Reveal from "../components/Reveal";
import ParticleField from "../components/ParticleField";

interface Member {
  name:        string;
  id:          string;
  role:        string;
  focus:       string;
  bio:         string;
  color:       "coral" | "cyan" | "violet";
  image?:      string;
  githubUrl:   string;
  linkedinUrl: string;
}

const TEAM: Member[] = [
  {
    name:        "Ali Irfan",
    id:          "21I-2572",
    role:        "Pipeline architect · Backend & deployment",
    focus:       "Stage 1 alignment · FastAPI · Hugging Face",
    bio:         "Designed the weighted multi-sequence alignment algorithm (Stage 1) that classifies every aligned chunk as SAME, SPLIT, MERGE, or NOISE — turning word-boundary disagreement into actionable metadata. Also owns the FastAPI backend and the Hugging Face Space deployment that keeps the inference orchestrator live for the demo.",
    color:       "coral",
    image:       "/ali-irfan.jpg",
    githubUrl:   "https://github.com/Eli-xir",
    linkedinUrl: "https://www.linkedin.com/in/ali-irfan-1750173a8",
  },
  {
    name:        "Nouman Hafeez",
    id:          "21I-0416",
    role:        "Corpus + retrieval · Web app · LLM strategy",
    focus:       "Stage 2 · System architecture · LLM integration",
    bio:         "Built the 500K-token Urdu lexicon for Stage 2 — BK-tree fuzzy lookup ranked by an n-gram language model. Led the full web app redesign and overall system architecture, and drove the LLM research and integration strategy that shaped how Stage 4 consumes upstream metadata under bounded authority.",
    color:       "cyan",
    image:       "/nouman-hafeez.png",
    githubUrl:   "https://github.com/noumanic",
    linkedinUrl: "https://www.linkedin.com/in/noumanic/",
  },
  {
    name:        "Rafay Khattak",
    id:          "21I-0423",
    role:        "Research pitch · Evaluation lead",
    focus:       "Idea pitching · Evaluations · Ablation",
    bio:         "Pitched the original CORAL research idea and framed the consensus-refinement hypothesis that the project is built around. Owns the full evaluation methodology — Common Voice and conversational benchmarks, the eight-step ablation suite, residual-error analysis, and the WER/CER reporting that drives the future-work roadmap.",
    color:       "violet",
    githubUrl:   "https://github.com/rafaykhattak",
    linkedinUrl: "https://www.linkedin.com/in/rafaykhattak",
  },
];

const SUPERVISORS = [
  {
    name:    "Ms. Kainat Iqbal",
    role:    "Primary Supervisor",
    affil:   "FAST-NUCES Islamabad · Department of Artificial Intelligence & Data Science",
  },
  {
    name:    "Ms. Saira Qamar",
    role:    "Co-Supervisor",
    affil:   "FAST-NUCES Islamabad · Department of Artificial Intelligence & Data Science",
  },
];

const COL: Record<string, { grad: string; ring: string; text: string; glow: string }> = {
  coral:  { grad: "grad-coral",  ring: "ring-rose-400/40",   text: "text-rose-400",  glow: "glow-coral"  },
  cyan:   { grad: "grad-cyan",   ring: "ring-cyan-400/40",   text: "text-cyan-400",   glow: "glow-cyan"   },
  violet: { grad: "grad-violet", ring: "ring-violet-400/40", text: "text-violet-400", glow: "glow-violet" },
};

export default function TeamPage() {
  return (
    <div className="overflow-x-hidden">

      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
        <div className="aurora-blob -z-10 top-10  left-[10%] w-96 h-96 grad-violet animate-aurora" />
        <div className="aurora-blob -z-10 bottom-0 right-[5%] w-80 h-80 grad-cyan   animate-aurora" style={{ animationDelay: "4s" }} />
        <ParticleField count={28} />

        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-rose-400 mb-4">— Team</p>
            <h1 className="font-sans text-[clamp(2.5rem,6.5vw,5.5rem)] font-extrabold tracking-[-0.03em] leading-[1.02] text-white max-w-5xl">
              Three engineers, two iterations,<br />
              <span className="grad-text-aurora">one pipeline.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg text-slate-300 leading-relaxed">
              CORAL was built over two iterations of the Final Year Project at the FAST School of
              Computing — three Computer Science undergraduates at FAST-NUCES Islamabad, each owning
              specific pipeline stages but co-designing the architecture end-to-end.
            </p>

            <div className="mt-7 inline-flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] ring-1 ring-white/10 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                FAST School of Computing
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] ring-1 ring-white/10 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Department of Computer Science
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] ring-1 ring-white/10 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                FAST-NUCES Islamabad
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger">
            {TEAM.map((m, i) => {
              const c = COL[m.color];
              return (
                <div key={i} className="group relative gradient-border p-px overflow-hidden">
                  <div className="relative rounded-[15px] bg-slate-900 p-8 overflow-hidden h-full">
                    <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full ${c.grad} opacity-30 blur-3xl group-hover:opacity-60 transition-opacity duration-500`} />

                    <div className="relative">
                      {m.image ? (
                        <div className={`relative w-28 h-28 rounded-2xl overflow-hidden ${c.glow} mb-6 ring-2 ${c.ring} ring-offset-4 ring-offset-slate-900`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.image} alt={m.name} className="w-full h-full object-cover object-top" />
                        </div>
                      ) : (
                        <div className={`relative w-24 h-24 rounded-2xl ${c.grad} ${c.glow} flex items-center justify-center font-sans text-3xl font-extrabold text-white mb-6 ring-2 ${c.ring} ring-offset-4 ring-offset-slate-900`}>
                          {m.name.split(" ").map(n => n[0]).join("")}
                        </div>
                      )}

                      <h3 className="font-sans text-2xl font-extrabold tracking-tight text-white">{m.name}</h3>
                      <p className="font-mono text-[10px] tracking-widest uppercase text-slate-400 mt-1">{m.id} · {m.role}</p>

                      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/[0.04] ring-1 ring-white/10 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase font-semibold text-white">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace("text-", "bg-")}`} />
                        {m.focus}
                      </div>

                      <p className="mt-6 text-sm leading-relaxed text-slate-300">{m.bio}</p>

                      <div className="mt-7 flex gap-2">
                        <a href={m.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/10 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase text-white transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/></svg>
                          GitHub
                        </a>
                        <a href={m.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/10 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase text-white transition-colors">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0H5a5 5 0 0 0-5 5v14a5 5 0 0 0 5 5h14a5 5 0 0 0 5-5V5a5 5 0 0 0-5-5zM8 19H5V8h3v11zM6.5 6.7a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zM20 19h-3v-5.6c0-3.4-4-3.1-4 0V19h-3V8h3v1.8c1.4-2.6 7-2.8 7 2.5V19z"/></svg>
                          LinkedIn
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SUPERVISORS */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="mb-10 text-center">
              <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-cyan-400 mb-3">— Supervision</p>
              <h2 className="font-sans text-4xl sm:text-5xl font-extrabold tracking-tight text-white">Supervisors</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto stagger">
            {SUPERVISORS.map((s, i) => (
              <div key={i} className="card card-hover p-7 flex items-center gap-5">
                <div className="w-16 h-16 rounded-full grad-aurora text-white flex items-center justify-center font-sans text-xl font-bold shrink-0 glow-violet">
                  {s.name.split(" ").slice(-2).map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-sans text-xl font-bold tracking-tight text-white">{s.name}</p>
                  <p className="font-mono text-[10px] tracking-widest uppercase text-rose-400 mt-0.5">{s.role}</p>
                  <p className="text-sm text-slate-300 mt-2">{s.affil}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTITUTION BANNER */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="relative gradient-border-bright gradient-border p-px overflow-hidden">
              <div className="relative rounded-[15px] bg-slate-900 overflow-hidden">

                {/* Building photo strip */}
                <div className="relative h-56 sm:h-72 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/fast-computing-school.jpg" alt="FAST School of Computing · Islamabad Campus" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/20" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-6 sm:left-10 right-6 flex items-end justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-rose-400 mb-2">— Institution</p>
                      <p className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-white">FAST School of Computing</p>
                      <p className="font-mono text-[11px] tracking-widest text-slate-300 mt-1">Islamabad Campus</p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur ring-1 ring-white/15 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      FAST-NUCES
                    </span>
                  </div>
                </div>

                <div className="relative p-10 sm:p-12 overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full grad-coral opacity-25 blur-3xl" />

                  <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div>
                      <h3 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                        National University of <span className="grad-text-aurora">Computer &amp; Emerging Sciences</span>
                      </h3>
                      <p className="mt-4 text-slate-300 leading-relaxed">
                        The three-member CORAL team are Computer Science undergraduates at the
                        FAST School of Computing, Islamabad Campus. Supervision is provided by the
                        Department of Artificial Intelligence &amp; Data Science. Two FYP iterations —
                        FYP-1 (Generate-and-Refine concept) and FYP-2 (the deployed five-stage pipeline).
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { v: "2",         k: "FYP iterations" },
                        { v: "May 2026",  k: "Final submission" },
                        { v: "5",         k: "Pipeline stages" },
                        { v: "Open",      k: "Source release" },
                      ].map((s, i) => (
                        <div key={i} className="card p-5">
                          <p className="font-sans text-2xl font-extrabold text-white">{s.v}</p>
                          <p className="font-mono text-[10px] tracking-widest uppercase text-slate-400 mt-1">{s.k}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <h2 className="font-sans text-4xl font-extrabold tracking-tight text-white">See what the team built.</h2>
            <p className="mt-4 text-slate-300">Step through the pipeline interactively, or read the research.</p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/app" className="inline-flex items-center justify-center gap-2 rounded-full grad-coral text-white px-7 py-3.5 font-mono text-xs tracking-widest uppercase font-semibold shadow-[0_0_32px_rgba(255,107,107,0.35)] hover:shadow-[0_0_48px_rgba(255,107,107,0.6)] hover:-translate-y-0.5 transition-all">
                Launch Demo
              </Link>
              <Link href="/research" className="inline-flex items-center justify-center gap-2 rounded-full glass text-white px-7 py-3.5 font-mono text-xs tracking-widest uppercase font-semibold hover:bg-white/10 transition-all">
                Read Research
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
