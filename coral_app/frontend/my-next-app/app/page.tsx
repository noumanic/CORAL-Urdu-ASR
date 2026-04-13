"use client";
import { useState, useEffect } from "react";
import ModeSelector    from "./ModeSelector";
import Pass1Input      from "./Pass1Input";
import Pass0Speech     from "./Pass0Speech";
import Pass2Sieve      from "./Pass2Sieve";
import Pass3Correction from "./Pass3Correction";
import { AlignInfo, OOVResult } from "./lib/api";

const PASSES = [
  { id: 1, label: "01", title: "Alignment",  subtitle: "Input & align model transcripts" },
  { id: 2, label: "02", title: "OOV Scan",   subtitle: "Sieve scan for out-of-vocabulary tokens" },
  { id: 3, label: "03", title: "Correction", subtitle: "Voting & candidate correction" },
];

const ALL_KEYS = [
  "coral_p1_models","coral_p1_sourceId","coral_p1_alignInfo",
  "coral_p1_mapping","coral_p1_rows","coral_p1_rowIdx","coral_p1_fileName",
  "coral_p1_mappingConfirmed",
  "coral_p2_oovResult","coral_p2_done",
  "coral_p3_result",
  "coral_page_activePass","coral_page_alignInfo","coral_page_oovResult",
  "coral_page_mode",
];

function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}

export default function Home() {
  const [mode,       setMode]       = useState<"file" | "speech" | null>(null);
  const [activePass, setActivePass] = useState(1);
  const [alignInfo,  setAlignInfo]  = useState<AlignInfo  | null>(null);
  const [oovResult,  setOovResult]  = useState<OOVResult  | null>(null);
  const [hydrated,   setHydrated]   = useState(false);

  // Initial Hydration
  useEffect(() => {
    setMode(lsGet<"file" | "speech">("coral_page_mode"));
    setActivePass(lsGet<number>("coral_page_activePass") || 1);
    setAlignInfo(lsGet<AlignInfo>("coral_page_alignInfo"));
    setOovResult(lsGet<OOVResult>("coral_page_oovResult"));
    setHydrated(true);
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    if (!hydrated) return;
    const sync = {
      coral_page_mode: mode,
      coral_page_activePass: activePass,
      coral_page_alignInfo: alignInfo,
      coral_page_oovResult: oovResult
    };
    Object.entries(sync).forEach(([k, v]) => {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, JSON.stringify(v));
    });
  }, [mode, activePass, alignInfo, oovResult, hydrated]);

  const models = alignInfo ? Object.keys(alignInfo).filter(k => k !== "source_model") : [];

  const handleAligned = (info: AlignInfo) => {
    setAlignInfo(info);
    setOovResult(null);
    setActivePass(2);
  };

  const handleOOV = (result: OOVResult) => {
    setOovResult(result);
    setActivePass(3);
  };

  const clearSession = () => {
    ALL_KEYS.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  };

  if (!hydrated) return null;
  if (!mode) return <ModeSelector onSelect={(m) => { setMode(m); setActivePass(1); }} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Header ── */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-sm font-semibold tracking-widest uppercase">CORAL</span>
            <button
              onClick={() => { setMode(null); setAlignInfo(null); setOovResult(null); setActivePass(1); }}
              className={`px-2 py-0.5 rounded border font-mono text-xs tracking-widest transition-colors ${
                mode === "speech" ? "border-violet-800 text-violet-400" : "border-cyan-900 text-cyan-600"
              }`}
            >
              {mode === "speech" ? "🎙 Speech" : "📄 File"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {PASSES.map(p => {
                const locked = (p.id === 2 && !alignInfo) || (p.id === 3 && !oovResult);
                return (
                  <button
                    key={p.id}
                    onClick={() => !locked && setActivePass(p.id)}
                    className={`px-3 py-1 rounded font-mono text-xs tracking-widest transition-colors ${
                      activePass === p.id ? "bg-zinc-800 text-zinc-100" : locked ? "text-zinc-700 cursor-not-allowed" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <button onClick={clearSession} className="px-3 py-1 rounded border border-zinc-800 font-mono text-xs text-zinc-600 hover:text-red-400">
              ✕ Clear
            </button>
          </div>
        </div>
      </header>

      {/* ── Pass Info ── */}
      <div className="border-b border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-5xl font-bold text-zinc-800 select-none">{PASSES[activePass - 1].label}</span>
            <div>
              <h1 className="font-mono text-xl font-semibold text-zinc-100">{PASSES[activePass - 1].title}</h1>
              <p className="font-mono text-xs text-zinc-500">{PASSES[activePass - 1].subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="border-b border-zinc-900">
        <div className="mx-auto max-w-5xl px-6 flex">
          {PASSES.map(p => (
            <div key={p.id} className={`flex-1 h-0.5 transition-all duration-500 ${p.id <= activePass ? "bg-cyan-600" : "bg-zinc-800"}`} />
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {activePass === 1 && (
          mode === "file" 
            ? <Pass1Input onAligned={handleAligned} /> 
            : <Pass0Speech onAligned={handleAligned} />
        )}

        {activePass === 2 && alignInfo && (
          <Pass2Sieve alignInfo={alignInfo} models={models} onOOVResult={handleOOV} />
        )}

        {activePass === 3 && alignInfo && oovResult && (
          <Pass3Correction alignInfo={alignInfo} oovResult={oovResult} />
        )}
      </main>
    </div>
  );
}