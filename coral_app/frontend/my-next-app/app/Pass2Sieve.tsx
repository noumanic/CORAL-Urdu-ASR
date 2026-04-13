"use client";
import { useState, useEffect, useRef } from "react";
import { AlignInfo, OOVResult } from "./lib/api";

interface Props {
  alignInfo:    AlignInfo;
  models:       string[];
  onOOVResult:  (result: OOVResult) => void;
}

const MATCH_THEME: Record<number, string> = {
  0: "border-emerald-700 bg-emerald-950 text-emerald-200",
  1: "border-blue-700    bg-blue-950    text-blue-200",
  2: "border-red-700     bg-red-950     text-red-200",
  3: "border-amber-700   bg-amber-950   text-amber-200",
};

const s = {
  label:    "text-zinc-600 uppercase",
  btnGhost: "text-zinc-500 hover:text-violet-400 transition-colors",
  btnApply: "w-full rounded-lg bg-teal-950 border border-teal-800 py-3 text-teal-300 font-mono font-semibold text-sm uppercase tracking-widest hover:bg-teal-900 transition-colors",
  token:    (scanned: boolean, isOOV: boolean, isActive: boolean, isCursor: boolean, matchType: number) => {
    const base = "px-2 py-1 rounded font-urdu text-sm border transition-all";
    if (isCursor)  return `${base} border-violet-400 bg-violet-900 scale-110 z-10 shadow-lg`;
    if (!scanned)  return `${base} border-zinc-800 text-zinc-700`;
    return [
      base,
      MATCH_THEME[matchType] ?? MATCH_THEME[0],
      isOOV    ? "underline decoration-dashed decoration-rose-500 cursor-pointer" : "cursor-default",
      isActive ? "ring-2 ring-rose-400" : "",
    ].join(" ");
  },
};

interface ModelAlignment {
  attempt_alignment: string[];
  attempt_matchinfo: number[];
}

export default function Pass2Sieve({ alignInfo, models, onOOVResult }: Props) {
  const [sievePos,    setSievePos]    = useState<number | null>(null);
  const [isDone,      setIsDone]      = useState(false);
  const [oovResult,   setOovResult]   = useState<OOVResult | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxLen = Math.max(...models.map(m => (alignInfo[m] as ModelAlignment)?.attempt_alignment.length ?? 0));

  async function fetchOOVData() {
    setIsLoading(true);
    try {
      const { api } = await import("./lib/api");
      const res = await api.oov({ align_info: alignInfo, freq_cutoff: 2000, depth: 50, top_n: 8 });
      setOovResult(res);
    } finally { setIsLoading(false); }
  }

  function startAnimation() {
    if (timerRef.current) clearInterval(timerRef.current);
    setSievePos(0); setIsDone(false);
    timerRef.current = setInterval(() => {
      setSievePos(p => {
        if (p !== null && p >= maxLen) { 
          clearInterval(timerRef.current!); 
          setIsDone(true); 
          return p; 
        }
        return (p ?? 0) + 1;
      });
    }, 180);
  }

  function runSieve() { fetchOOVData(); startAnimation(); }

  useEffect(() => {
    const t = setTimeout(runSieve, 1000);
    return () => { clearTimeout(t); if (timerRef.current) clearInterval(timerRef.current); };
  }, [alignInfo]);

  return (
    <div className="space-y-5 font-mono text-xs">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-4">
          {isLoading                      && <span className="text-violet-400">● Fetching OOV...</span>}
          {sievePos !== null && !isDone   && <span className="text-violet-400 animate-pulse">● Scanning...</span>}
          {isDone                         && <span className="text-emerald-400">● Scan complete</span>}
        </div>
        {isDone && <button onClick={runSieve} className={s.btnGhost}>↺ Re-run</button>}
      </div>

      <div className="h-0.5 bg-zinc-800">
        <div className="h-full bg-violet-500 transition-all" style={{ width: `${(sievePos ?? 0) / maxLen * 100}%` }} />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-6">
        {models.map(model => {
          const { attempt_alignment, attempt_matchinfo } = alignInfo[model] as ModelAlignment;
          const isSrc = model === alignInfo.source_model;
          return (
            <div key={model} className="space-y-2">
              <p className={s.label}>{isSrc ? `★ ${model}` : model}</p>
              <div className="flex flex-wrap gap-1.5" dir="rtl">
                {attempt_alignment.map((word, i) => {
                  const scanned  = isDone || (sievePos !== null && i < sievePos);
                  const isOOV    = scanned && !!oovResult?.oov_dict.includes(word);
                  const isActive = activeToken === word;
                  return (
                    <button key={i}
                      onClick={() => isOOV && setActiveToken(isActive ? null : word)}
                      className={s.token(scanned, isOOV, isActive, sievePos === i, attempt_matchinfo[i] ?? 0)}
                    >
                      {word || "∅"}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {activeToken && oovResult?.metadata[activeToken] && (
        <div className="rounded-xl border border-rose-900 bg-zinc-950 overflow-hidden">
          <div className="p-3 border-b border-rose-900 bg-rose-950/20 text-rose-400">
            Candidates: <span className="font-urdu text-rose-200 text-lg ml-2">{activeToken}</span>
          </div>
          <table className="w-full text-center">
            <thead className="text-zinc-500 border-b border-zinc-800">
              <tr>{oovResult.columns.map(c => <th key={c} className="p-2 font-normal">{c}</th>)}</tr>
            </thead>
            <tbody className="text-zinc-400">
              {Object.entries(oovResult.metadata[activeToken]).map(([word, meta], i) => {
                const m = meta as (string | number)[];
                return (
                  <tr key={word} className={`border-b border-zinc-900 ${i === 0 ? "bg-zinc-900/40" : ""}`}>
                    <td className="p-2 font-urdu text-right text-zinc-100">{word}</td>
                    <td className="p-2"><span className="px-1.5 rounded bg-zinc-800">{m[0]}</span></td>
                    <td className="p-2">{m[1]}/3</td>
                    <td className="p-2">{m[2]}/2</td>
                    <td className="p-2">{m[3]}</td>
                    <td className="p-2">{m[4] || "—"}</td>
                    <td className="p-2">{m[5] || "—"}</td>
                    <td className="p-2">{m[6] || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isDone && oovResult && (
        <button onClick={() => onOOVResult(oovResult)} className={s.btnApply}>
          APPLY CORRECTION →
        </button>
      )}
    </div>
  );
}