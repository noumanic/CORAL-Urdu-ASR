"use client";
import { useState } from "react";
import Pass1Input     from "./Pass1Input";
import Pass2Sieve     from "./Pass2Sieve";
import Pass3Correction from "./Pass3Correction";
import { AlignInfo, OOVResult } from "./lib/api";
 
const PASSES = [
  { id: 1, label: "01", title: "Alignment",  subtitle: "Input & align model transcripts" },
  { id: 2, label: "02", title: "OOV Scan",   subtitle: "Sieve scan for out-of-vocabulary tokens" },
  { id: 3, label: "03", title: "Correction", subtitle: "Voting & candidate correction" },
];

export default function Home() {
  const [activePass, setActivePass] = useState(1);
  const [alignInfo,  setAlignInfo]  = useState<AlignInfo  | null>(null);
  const [oovResult,  setOovResult]  = useState<OOVResult  | null>(null);

  const handleAligned = (info: AlignInfo) => {
    setAlignInfo(info);
    setActivePass(2);
  };

  const handleOOV = (result: OOVResult) => {
    setOovResult(result);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-sm font-semibold tracking-widest text-zinc-100 uppercase">
              CORAL
            </span>
            <span className="font-mono text-xs text-zinc-600 tracking-widest uppercase">
              Urdu ASR Post-Correction
            </span>
          </div>
          <div className="flex gap-1">
            {PASSES.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  if (p.id === 1) setActivePass(1);
                  if (p.id === 2 && alignInfo) setActivePass(2);
                  if (p.id === 3 && alignInfo && oovResult) setActivePass(3);
                }}
                className={`px-3 py-1 rounded font-mono text-xs tracking-widest transition-colors ${
                  activePass === p.id
                    ? "bg-zinc-800 text-zinc-100"
                    : p.id === 2 && !alignInfo
                    ? "text-zinc-700 cursor-not-allowed"
                    : p.id === 3 && (!alignInfo || !oovResult)
                    ? "text-zinc-700 cursor-not-allowed"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* pass header */}
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

      {/* pass progress */}
      <div className="border-b border-zinc-900">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex">
            {PASSES.map((p, i) => (
              <div
                key={p.id}
                className={`flex-1 h-0.5 transition-colors ${
                  p.id <= activePass ? "bg-cyan-600" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {activePass === 1 && (
          <Pass1Input onAligned={handleAligned} />
        )}

        {activePass === 2 && alignInfo && (
          <div className="space-y-6">
            <Pass2Sieve alignInfo={alignInfo} onOOVResult={handleOOV} />
            {oovResult && (
              <button
                onClick={() => setActivePass(3)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-3 text-sm font-mono font-semibold text-zinc-300 uppercase tracking-widest transition-all hover:bg-zinc-800 hover:border-zinc-600"
              >
                PROCEED TO CORRECTION →
              </button>
            )}
          </div>
        )}

        {activePass === 3 && alignInfo && oovResult && (
          <Pass3Correction alignInfo={alignInfo} oovResult={oovResult} />
        )}
      </main>
    </div>
  );
}
