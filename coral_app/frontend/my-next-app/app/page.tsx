"use client";
import { useState, useEffect } from "react";
import Pass1Input      from "./Pass1Input";
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
];

function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export default function Home() {
  const [activePass, setActivePass] = useState(1);
  const [alignInfo,  setAlignInfo]  = useState<AlignInfo  | null>(null);
  const [oovResult,  setOovResult]  = useState<OOVResult  | null>(null);
  const [hydrated,   setHydrated]   = useState(false);

  // Hydrate once on mount — never runs again
  useEffect(() => {
    const ap = lsGet<number>("coral_page_activePass");
    const ai = lsGet<AlignInfo>("coral_page_alignInfo");
    const ov = lsGet<OOVResult>("coral_page_oovResult");
    if (ai) setAlignInfo(ai);
    if (ov) setOovResult(ov);
    if (ap) setActivePass(ap);
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) lsSet("coral_page_activePass", activePass); }, [activePass, hydrated]);
  useEffect(() => { if (hydrated) lsSet("coral_page_alignInfo",  alignInfo);  }, [alignInfo,  hydrated]);
  useEffect(() => { if (hydrated) lsSet("coral_page_oovResult",  oovResult);  }, [oovResult,  hydrated]);

  const models = alignInfo
    ? Object.keys(alignInfo).filter(k => k !== "source_model")
    : [];

  // Only called when user explicitly clicks RUN ALIGNMENT — clears downstream
  const handleAligned = (info: AlignInfo) => {
    setAlignInfo(info);
    setOovResult(null);
    try {
      localStorage.removeItem("coral_p2_oovResult");
      localStorage.removeItem("coral_p2_done");
      localStorage.removeItem("coral_p3_result");
    } catch {}
    setActivePass(2);
  };

  const handleOOV = (result: OOVResult) => {
    setOovResult(result);
    // auto-advance to correction once OOV is done
    setActivePass(3);
  };

  const clearSession = () => {
    ALL_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    window.location.reload();
  };

  // Don't render until hydrated — prevents flash of wrong pass
  if (!hydrated) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* ── Header ── */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-sm font-semibold tracking-widest text-zinc-100 uppercase">CORAL</span>
            <span className="font-mono text-xs text-zinc-600 tracking-widest uppercase hidden sm:block">
              Urdu ASR Post-Correction
            </span>
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
                    className={`px-3 py-1 rounded font-mono text-xs tracking-widest transition-colors ${
                      activePass === p.id
                        ? "bg-zinc-800 text-zinc-100"
                        : locked
                        ? "text-zinc-700 cursor-not-allowed"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={clearSession}
              className="px-3 py-1 rounded border border-zinc-800 font-mono text-xs text-zinc-600 hover:border-red-800 hover:text-red-400 transition-colors"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      </header>

      {/* ── Pass header ── */}
      <div className="border-b border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-5xl font-bold text-zinc-800 select-none">
              {PASSES[activePass - 1].label}
            </span>
            <div>
              <h1 className="font-mono text-xl font-semibold text-zinc-100 tracking-tight">
                {PASSES[activePass - 1].title}
              </h1>
              <p className="font-mono text-xs text-zinc-500 mt-0.5">
                {PASSES[activePass - 1].subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="border-b border-zinc-900">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex">
            {PASSES.map(p => (
              <div
                key={p.id}
                className={`flex-1 h-0.5 transition-all duration-500 ${p.id <= activePass ? "bg-cyan-600" : "bg-zinc-800"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Content — keep all passes mounted to preserve state, show/hide with CSS ── */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className={activePass === 1 ? "" : "hidden"}>
          <Pass1Input
            onAligned={handleAligned}
            existingAlignInfo={alignInfo}
          />
        </div>

        {alignInfo && (
          <div className={activePass === 2 ? "" : "hidden"}>
            <Pass2Sieve alignInfo={alignInfo}
             models={models} onOOVResult={handleOOV}
              isActive={activePass === 2}
            />
          </div>
        )}

        {alignInfo && oovResult && (
          <div className={activePass === 3 ? "" : "hidden"}>
            <Pass3Correction alignInfo={alignInfo} oovResult={oovResult} />
          </div>
        )}
      </main>
    </div>
  );
}
