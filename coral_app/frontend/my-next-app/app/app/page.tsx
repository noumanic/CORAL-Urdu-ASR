"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import ModeSelector    from "../ModeSelector";
import Pass1Input      from "../Pass1Input";
import Pass0Speech     from "../Pass0Speech";
import Pass2Sieve      from "../Pass2Sieve";
import Pass3Correction from "../Pass3Correction";
import { AlignInfo, OOVResult } from "../lib/api";

const PASSES = [
  { id: 1, label: "01", title: "Alignment",  subtitle: "Input & align model transcripts" },
  { id: 2, label: "02", title: "OOV Scan",   subtitle: "Sieve scan for out-of-vocabulary tokens" },
  { id: 3, label: "03", title: "Correction", subtitle: "Voting & LLM refinement" },
];

const ALL_KEYS = [
  "coral_p1_models","coral_p1_sourceId","coral_p1_alignInfo",
  "coral_p1_mapping","coral_p1_rows","coral_p1_rowIdx","coral_p1_fileName",
  "coral_p1_mappingConfirmed",
  "coral_p1_headers","coral_p1_delim","coral_p1_isJson","coral_p1_rawContent",
  "coral_p2_oovResult","coral_p2_done",
  "coral_p3_result","coral_p3_llm_result",
  "coral_page_activePass","coral_page_alignInfo","coral_page_oovResult",
  "coral_page_mode",
];

function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}

export default function AppPage() {
  const [mode,       setMode]       = useState<"file" | "speech" | null>(null);
  const [activePass, setActivePass] = useState(1);
  const [alignInfo,  setAlignInfo]  = useState<AlignInfo  | null>(null);
  const [oovResult,  setOovResult]  = useState<OOVResult  | null>(null);
  const [hydrated,   setHydrated]   = useState(false);

  useEffect(() => {
    setMode(lsGet<"file" | "speech">("coral_page_mode"));
    setActivePass(lsGet<number>("coral_page_activePass") || 1);
    setAlignInfo(lsGet<AlignInfo>("coral_page_alignInfo"));
    setOovResult(lsGet<OOVResult>("coral_page_oovResult"));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const sync: Record<string, unknown> = {
      coral_page_mode:       mode,
      coral_page_activePass: activePass,
      coral_page_alignInfo:  alignInfo,
      coral_page_oovResult:  oovResult,
    };
    Object.entries(sync).forEach(([k, v]) => {
      if (v === null || v === undefined) localStorage.removeItem(k);
      else localStorage.setItem(k, JSON.stringify(v));
    });
  }, [mode, activePass, alignInfo, oovResult, hydrated]);

  const models = alignInfo ? Object.keys(alignInfo).filter(k => k !== "source_model") : [];

  const handleAligned = (info: AlignInfo) => {
    setAlignInfo(info);
    setOovResult(null);
    localStorage.removeItem("coral_p2_oovResult");
    localStorage.removeItem("coral_p2_done");
    localStorage.removeItem("coral_p3_result");
    localStorage.removeItem("coral_p3_llm_result");
    setActivePass(2);
  };

  const handleOOV = (result: OOVResult) => {
    setOovResult(result);
    setActivePass(3);
  };

  const clearSession = () => {
    ALL_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    window.location.reload();
  };

  const resetMode = () => {
    setMode(null);
    setAlignInfo(null);
    setOovResult(null);
    setActivePass(1);
  };

  if (!hydrated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulseSoft" />
      </div>
    );
  }

  if (!mode) {
    return <ModeSelector onSelect={(m) => { setMode(m); setActivePass(1); }} />;
  }

  return (
    <div className="min-h-screen">

      {/* sub-rail */}
      <div className="border-b border-white/10 glass-strong sticky top-[68px] z-40">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-mono text-[10px] tracking-widest uppercase text-slate-400 hover:text-white transition-colors">
              ← Back
            </Link>
            <span className="font-mono text-[10px] tracking-widest uppercase text-slate-400">/</span>
            <span className="font-mono text-[10px] tracking-widest uppercase text-white font-semibold">Demo</span>
            <button
              onClick={resetMode}
              className={`ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 font-mono text-[10px] tracking-widest uppercase font-semibold transition-colors ${
                mode === "speech"
                  ? "ring-violet-400/40 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                  : "ring-cyan-400/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mode === "speech" ? "bg-violet-500" : "bg-cyan-500"}`} />
              {mode === "speech" ? "Speech" : "File"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {PASSES.map(p => {
                const locked =
                  (p.id === 2 && !alignInfo) ||
                  (p.id === 3 && (!alignInfo || !oovResult));
                return (
                  <button
                    key={p.id}
                    onClick={() => !locked && setActivePass(p.id)}
                    className={`px-3 py-1.5 rounded-md font-mono text-[10px] tracking-widest uppercase font-semibold transition-all ${
                      activePass === p.id
                        ? "grad-coral text-white shadow-[0_0_20px_rgba(255,107,107,0.4)]"
                        : locked
                        ? "text-slate-500 cursor-not-allowed"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={clearSession}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md ring-1 ring-white/10 font-mono text-[10px] tracking-widest uppercase font-semibold text-slate-400 hover:ring-rose-400/40 hover:text-rose-400 transition-colors"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      </div>

      {/* heading band */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-7 flex items-baseline gap-5">
          <span className="font-sans text-5xl font-extrabold tracking-tight text-white/10 select-none">
            {PASSES[activePass - 1].label}
          </span>
          <div>
            <h1 className="font-sans text-2xl font-extrabold tracking-tight text-white">
              {PASSES[activePass - 1].title}
            </h1>
            <p className="text-sm text-slate-300 mt-0.5">{PASSES[activePass - 1].subtitle}</p>
          </div>
        </div>
      </div>

      {/* progress */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex">
            {PASSES.map(p => (
              <div
                key={p.id}
                className={`flex-1 h-0.5 transition-all duration-500 ${
                  p.id <= activePass ? "grad-coral" : "bg-white/5"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* body */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="gradient-border p-px">
          <div className="rounded-[15px] bg-slate-900 text-slate-100 p-6 sm:p-8">
            <div className={activePass === 1 ? "" : "hidden"}>
              {mode === "file"
                ? <Pass1Input onAligned={handleAligned} />
                : <Pass0Speech onAligned={handleAligned} />
              }
            </div>

            <div className={activePass === 2 && alignInfo ? "" : "hidden"}>
              {alignInfo && (
                <Pass2Sieve
                  alignInfo={alignInfo}
                  models={models}
                  onOOVResult={handleOOV}
                />
              )}
            </div>

            <div className={activePass === 3 && alignInfo && oovResult ? "" : "hidden"}>
              {alignInfo && oovResult && (
                <Pass3Correction alignInfo={alignInfo} oovResult={oovResult} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
