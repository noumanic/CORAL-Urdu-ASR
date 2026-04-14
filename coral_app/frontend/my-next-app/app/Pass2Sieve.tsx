"use client";
import { useState, useEffect, useRef } from "react";
import { AlignInfo, OOVResult } from "./lib/api";
import SplitMergeAnimator from "./SplitMergeAnimator";

interface Props {
  alignInfo:   AlignInfo;
  models:      string[];
  onOOVResult: (result: OOVResult) => void;
}

interface ModelAlignment {
  attempt_alignment:    string[];
  attempt_matchinfo:    number[];
  split_merge_attempt:  string[];
  split_merge_matchinfo: number[];
  split_merge?: {
    candidates: {
      type:                     "split" | "merge";
      source_words:             string[];
      model_words:              string[];
      model_word_idx_span:      [number, number];
      source_word_idx_span:     [number, number];
      source_boundaries_in_span: number[];
      model_boundaries_in_span:  number[];
      char_span_start:          number;
      char_span_end:            number;
    }[];
  };
}

type Phase = "sieve" | "split-merge" | "done";

const MATCH_THEME: Record<number, string> = {
  0: "border-emerald-700 bg-emerald-950 text-emerald-200",
  1: "border-blue-700    bg-blue-950    text-blue-200",
  2: "border-red-700     bg-red-950     text-red-200",
  3: "border-amber-700   bg-amber-950   text-amber-200",
};

const cls = {
  label:     "text-zinc-600 uppercase font-mono text-xs",
  btnGhost:  "text-zinc-500 hover:text-violet-400 transition-colors font-mono text-xs",
  btnApply:  "w-full rounded-lg bg-teal-950 border border-teal-800 py-3 text-teal-300 font-mono font-semibold text-sm uppercase tracking-widest hover:bg-teal-900 transition-colors",
  statusBar: "rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center justify-between",
  wordGrid:  "rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-6",
  chip: (scanned: boolean, isOOV: boolean, isActive: boolean, isCursor: boolean, matchType: number, animated: boolean) => {
    const base = "px-2 py-1 rounded font-urdu text-sm border transition-all duration-300";
    if (isCursor)  return `${base} border-violet-400 bg-violet-900 scale-110 z-10 shadow-lg`;
    if (!scanned)  return `${base} border-zinc-800 text-zinc-700`;
    if (animated)  return `${base} border-cyan-500 bg-cyan-950 text-cyan-200 scale-105`;
    return [
      base,
      MATCH_THEME[matchType] ?? MATCH_THEME[0],
      isOOV    ? "underline decoration-dashed decoration-rose-500 cursor-pointer" : "cursor-default",
      isActive ? "ring-2 ring-rose-400" : "",
    ].join(" ");
  },
  splitChip:  "px-2 py-1 rounded font-urdu text-sm border border-orange-700 bg-orange-950 text-orange-200 transition-all duration-500",
  mergeChip:  "px-2 py-1 rounded font-urdu text-sm border border-purple-700 bg-purple-950 text-purple-200 transition-all duration-500",
  resolvedChip: "px-2 py-1 rounded font-urdu text-sm border border-cyan-600 bg-cyan-950 text-cyan-100 scale-105 transition-all duration-500",
};

export default function Pass2Sieve({ alignInfo, models, onOOVResult }: Props) {
  const [sievePos,     setSievePos]     = useState<number | null>(null);
  const [phase,        setPhase]        = useState<Phase>("sieve");
  const [oovResult,    setOovResult]    = useState<OOVResult | null>(null);
  const [activeToken,  setActiveToken]  = useState<string | null>(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [animatedIdx,  setAnimatedIdx]  = useState<Record<string, Set<number>>>({});
  const [showResolved, setShowResolved] = useState<Record<string, Set<number>>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chipRefs      = useRef<Map<string, HTMLElement>>(new Map());
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [resolvedByModel, setResolvedByModel] = useState<Record<string, Set<number>>>({});
  const [animatingModels, setAnimatingModels] = useState<Set<string>>(new Set());
  const maxLen = Math.max(...models.map(m =>
    (alignInfo[m] as ModelAlignment)?.attempt_alignment.length ?? 0
  ));

  async function fetchOOV() {
    setIsLoading(true);
    try {
      const { api } = await import("./lib/api");
      const res = await api.oov({ align_info: alignInfo, freq_cutoff: 2000, depth: 50, top_n: 8 });
      setOovResult(res);
    } finally { setIsLoading(false); }
  }

  function startSieve() {
    if (timerRef.current) clearInterval(timerRef.current);
    setSievePos(0); setPhase("sieve");
    timerRef.current = setInterval(() => {
      setSievePos(p => {
        if (p !== null && p >= maxLen) {
          clearInterval(timerRef.current!);
          playSplitMergeAnimations();
          return p;
        }
        return (p ?? 0) + 1;
      });
    }, 180);
  }

  function playSplitMergeAnimations() {
    setPhase("split-merge");
    const modelsWithCandidates = models.filter(m =>
      (alignInfo[m] as ModelAlignment).split_merge?.candidates?.length
    );
    if (!modelsWithCandidates.length) { setPhase("done"); return; }
    setAnimatingModels(new Set(modelsWithCandidates));
  }

  function handleAnimationComplete(modelName: string, resolved: Set<number>) {
    setResolvedByModel(prev => ({ ...prev, [modelName]: resolved }));
    setAnimatingModels(prev => {
      const next = new Set(prev);
      next.delete(modelName);
      if (!next.size) setPhase("done");
      return next;
    });
  }

  function runSieve() { fetchOOV(); startSieve(); }

  useEffect(() => {
    const t = setTimeout(runSieve, 1200);
    return () => { clearTimeout(t); if (timerRef.current) clearInterval(timerRef.current); };
  }, [alignInfo]);

  const hasCandidates = models.some(m =>
    !!((alignInfo[m] as ModelAlignment).split_merge?.candidates?.length)
  );

  return (
    <div className="space-y-5 font-mono text-xs">

      <div className={cls.statusBar}>
        <div className="flex gap-4">
          {isLoading                        && <span className="text-violet-400">● Fetching OOV...</span>}
          {phase === "sieve"                && <span className="text-violet-400 animate-pulse">● Scanning...</span>}
          {phase === "split-merge"          && <span className="text-orange-400 animate-pulse">● Resolving splits &amp; merges...</span>}
          {phase === "done"                 && <span className="text-emerald-400">● Scan complete</span>}
        </div>
        {phase === "done" && <button onClick={runSieve} className={cls.btnGhost}>↺ Re-run</button>}
      </div>

      <div className="h-0.5 bg-zinc-800">
        <div className="h-full bg-violet-500 transition-all"
          style={{ width: `${(sievePos ?? 0) / maxLen * 100}%` }} />
      </div>

      {/* split/merge legend */}
      {hasCandidates && (
        <div className="flex gap-3 items-center flex-wrap">
          <span className="text-zinc-600 text-xs">match</span>
          <span className="px-2 py-0.5 rounded border border-emerald-700 bg-emerald-950 text-emerald-300 text-xs">match</span>
          <span className="px-2 py-0.5 rounded border border-blue-700 bg-blue-950 text-blue-300 text-xs">insertion</span>
          <span className="px-2 py-0.5 rounded border border-red-700 bg-red-950 text-red-300 text-xs">deletion</span>
          <span className="px-2 py-0.5 rounded border border-amber-700 bg-amber-950 text-amber-300 text-xs">substitution</span>
          <span className="text-zinc-700">·</span>
          <span className="px-2 py-0.5 rounded border border-orange-600 bg-orange-950 text-orange-300 text-xs">split</span>
          <span className="px-2 py-0.5 rounded border border-purple-700 bg-purple-950 text-purple-300 text-xs">merge</span>
          <span className="px-2 py-0.5 rounded border border-cyan-600 bg-cyan-950 text-cyan-200 text-xs">resolved</span>
        </div>
      )}

      <div className={cls.wordGrid}>
        {models.map(model => {
          const m = alignInfo[model] as ModelAlignment;
          const isSrc = model === alignInfo.source_model;
          const candidates = m.split_merge?.candidates ?? [];
          const words     = phase === "done" ? (m.split_merge_attempt ?? m.attempt_alignment) : m.attempt_alignment;
          const matchinfo = phase === "done" ? (m.split_merge_matchinfo ?? m.attempt_matchinfo) : m.attempt_matchinfo;

          return (
            <div key={model} className="space-y-2">
              <p className={cls.label}>{isSrc ? `★ ${model}` : model}</p>

              <div
                ref={el => { if (el) containerRefs.current.set(model, el); }}
                className="relative"
              >
                <div className="flex flex-wrap gap-1.5 invisible absolute" dir="rtl">
                  {(m.split_merge_attempt ?? []).map((word, i) => (
                    <span key={i}
                      ref={el => { if (el) chipRefs.current.set(`${model}:sm:${i}`, el); }}
                      className="px-2 py-1 rounded font-urdu text-sm border border-transparent"
                    >
                      {word}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5" dir="rtl">
                  {words.map((word, i) => {
                    const scanned  = phase !== "sieve" || (sievePos !== null && i < sievePos);
                    const isOOV    = scanned && !!oovResult?.oov_dict.includes(word);
                    const isActive = activeToken === word;
                    const isResolved = !!resolvedByModel[model]?.has(i);
                    return (
                      <div key={i} className="relative group">
                        <button
                          ref={el => { if (el) chipRefs.current.set(`${model}:${i}`, el); }}
                          onClick={() => isOOV && setActiveToken(isActive ? null : word)}
                          className={cls.chip(scanned, isOOV, isActive, sievePos === i, matchinfo[i] ?? 0, isResolved)}
                        >
                          {word || "∅"}
                        </button>
                        {isResolved && (() => {
                          const cand = candidates.find(c =>
                            i >= c.source_word_idx_span[0] && i <= c.source_word_idx_span[1]
                          );
                          return cand ? (
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex gap-1 z-50 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 whitespace-nowrap">
                              {cand.model_words.map((w, wi) => (
                                <span key={wi} className={`px-1.5 py-0.5 rounded font-urdu text-xs border ${
                                  cand.type === "split"
                                    ? "border-orange-700 bg-orange-950 text-orange-200"
                                    : "border-purple-700 bg-purple-950 text-purple-200"
                                }`}>{w}</span>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    );
                  })}
                </div>

                {phase === "split-merge" && animatingModels.has(model) && candidates.length > 0 && (
                  <SplitMergeAnimator
                    modelName={model}
                    candidates={candidates}
                    chipRefs={chipRefs}
                    containerRef={{ current: containerRefs.current.get(model) ?? null }}
                    onComplete={handleAnimationComplete}
                  />
                )}
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

      {phase === "done" && oovResult && (
        <button onClick={() => onOOVResult(oovResult)} className={cls.btnApply}>
          APPLY CORRECTION →
        </button>
      )}
    </div>
  );
}