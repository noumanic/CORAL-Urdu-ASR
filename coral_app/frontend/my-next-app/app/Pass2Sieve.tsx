"use client";
import { useState, useEffect, useRef } from "react";
import { AlignInfo, OOVResult, ModelAlign, InfoTag, MetaTag } from "./lib/api";

interface Props {
  alignInfo:   AlignInfo;
  models:      string[];
  onOOVResult: (result: OOVResult) => void;
}

type Phase = "sieve" | "word-color" | "expand" | "meta-color" | "done";

// ── text color by info tag ────────────────────────────────────────────────────
function infoTextClass(tag: InfoTag): string {
  switch (tag) {
    case "MATCH":        return "text-emerald-400";
    case "INSERTION":    return "text-yellow-400";
    case "DELETION":     return "text-red-400";
    case "SUBSTITUTION": return "text-amber-400";
    default:             return "text-zinc-300";
  }
}

// ── background color by meta tag ─────────────────────────────────────────────
function metaBgClass(tag: MetaTag): string {
  switch (tag) {
    case "SPLIT": return "bg-pink-950  border-pink-700";
    case "MERGE": return "bg-purple-950 border-purple-700";
    case "NOISE": return "bg-zinc-950  border-zinc-500";
    case "SAME":  return "bg-zinc-900  border-zinc-700";
    default:      return "bg-zinc-900  border-zinc-700";
  }
}

const BASE_CHIP = "px-2 py-1 rounded font-urdu text-sm border transition-all duration-300";

export default function Pass2Sieve({ alignInfo, models, onOOVResult }: Props) {
  const [phase,       setPhase]       = useState<Phase>("sieve");
  const [sievePos,    setSievePos]    = useState<number>(0);
  const [oovResult,   setOovResult]   = useState<OOVResult | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxLen = Math.max(
    ...models.map(m => (alignInfo[m] as ModelAlign)?.aligned_attempt?.length ?? 0)
  );

  async function fetchOOV() {
    setIsLoading(true);
    try {
      const { api } = await import("./lib/api");
      const res = await api.oov({ align_info: alignInfo, freq_cutoff: 2000, depth: 50, top_n: 8 });
      setOovResult(res);
    } finally {
      setIsLoading(false);
    }
  }

  function runPipeline() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("sieve");
    setSievePos(0);
    setOovResult(null);
    fetchOOV();

    // phase 1 — sieve scan
    timerRef.current = setInterval(() => {
      setSievePos(p => {
        if (p >= maxLen) {
          clearInterval(timerRef.current!);
          // phase 2 — word-level coloring
          setPhase("word-color");
          setTimeout(() => {
            // phase 3 — expand to split-merge tokens
            setPhase("expand");
            setTimeout(() => {
              // phase 4 — apply metadata backgrounds
              setPhase("meta-color");
              setTimeout(() => setPhase("done"), 600);
            }, 700);
          }, 700);
          return p;
        }
        return p + 1;
      });
    }, 160);
  }

  useEffect(() => {
    const t = setTimeout(runPipeline, 1200);
    return () => {
      clearTimeout(t);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [alignInfo]);

  // ── decide which token array to show per phase ────────────────────────────
  function tokensForPhase(m: ModelAlign): string[] {
    if (phase === "expand" || phase === "meta-color" || phase === "done")
      return m.split_merge_aligned_attempt ?? m.aligned_attempt ?? [];
    return m.aligned_attempt ?? [];
  }

  function infoForPhase(m: ModelAlign): InfoTag[] {
    if (phase === "expand" || phase === "meta-color" || phase === "done")
      return m.split_merge_aligned_info ?? m.aligned_info ?? [];
    return m.aligned_info ?? [];
  }

  // ── chip renderer ─────────────────────────────────────────────────────────
  function renderChip(
    word: string,
    idx: number,
    info: InfoTag,
    meta: MetaTag,
    scanned: boolean,
    isCursor: boolean,
    isOOV: boolean,
    isActive: boolean,
    showMeta: boolean,
  ) {
    if (!scanned) {
      return (
        <span key={idx} className={`${BASE_CHIP} border-zinc-800 text-zinc-700`}>
          {word || "∅"}
        </span>
      );
    }
    if (isCursor) {
      return (
        <span key={idx} className={`${BASE_CHIP} border-violet-400 bg-violet-900 text-violet-100 scale-110 shadow-lg`}>
          {word || "∅"}
        </span>
      );
    }

    const textCls  = infoTextClass(info);
    const bgCls    = showMeta ? metaBgClass(meta) : "bg-zinc-900 border-zinc-700";
    const oovCls   = isOOV
      ? "border-dashed cursor-pointer" + (isActive ? " ring-2 ring-rose-400" : "")
      : "";

    return (
      <button
        key={idx}
        onClick={() => isOOV && setActiveToken(isActive ? null : word)}
        className={`${BASE_CHIP} ${bgCls} ${textCls} ${oovCls}`}
      >
        {word || "∅"}
      </button>
    );
  }

  const progressPct = maxLen > 0 ? Math.min((sievePos / maxLen) * 100, 100) : 0;

  return (
    <div className="space-y-5 font-mono text-xs">

      {/* status bar */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-4">
          {isLoading               && <span className="text-violet-400">● fetching oov...</span>}
          {phase === "sieve"       && <span className="text-violet-400 animate-pulse">● scanning...</span>}
          {phase === "word-color"  && <span className="text-emerald-400 animate-pulse">● coloring matches...</span>}
          {phase === "expand"      && <span className="text-yellow-400 animate-pulse">● expanding tokens...</span>}
          {phase === "meta-color"  && <span className="text-pink-400 animate-pulse">● applying structure...</span>}
          {phase === "done"        && <span className="text-emerald-400">● scan complete</span>}
        </div>
        {phase === "done" && (
          <button onClick={runPipeline} className="text-zinc-500 hover:text-violet-400 transition-colors font-mono text-xs">
            ↺ re-run
          </button>
        )}
      </div>

      {/* progress bar */}
      <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-violet-500 transition-all duration-150"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* legend */}
      <div className="flex gap-3 items-center flex-wrap">
        <span className="text-zinc-600">info →</span>
        <span className="px-2 py-0.5 rounded border border-zinc-700 text-emerald-400 text-xs">match</span>
        <span className="px-2 py-0.5 rounded border border-zinc-700 text-yellow-400 text-xs">insertion</span>
        <span className="px-2 py-0.5 rounded border border-zinc-700 text-red-400 text-xs">deletion</span>
        <span className="px-2 py-0.5 rounded border border-zinc-700 text-amber-400 text-xs">substitution</span>
        <span className="text-zinc-700">·</span>
        <span className="text-zinc-600">meta →</span>
        <span className="px-2 py-0.5 rounded border border-pink-700   bg-pink-950   text-pink-300   text-xs">split</span>
        <span className="px-2 py-0.5 rounded border border-purple-700 bg-purple-950 text-purple-300 text-xs">merge</span>
        <span className="px-2 py-0.5 rounded border border-zinc-700   bg-zinc-900   text-zinc-300   text-xs">same</span>
        <span className="px-2 py-0.5 rounded border border-zinc-500   bg-zinc-950   text-zinc-400   text-xs">noise</span>
        <span className="text-zinc-700">·</span>
        <span className="px-2 py-0.5 rounded border border-dashed border-rose-600 text-rose-400 text-xs">oov</span>
      </div>

      {/* model rows */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-6">
        {models.map(model => {
          const m   = alignInfo[model] as ModelAlign;
          const src = model === alignInfo.source_model;

          if (src) {
            return (
              <div key={model} className="space-y-2">
                <p className="text-zinc-600 uppercase font-mono text-xs">★ {model}</p>
                <div className="flex flex-wrap gap-1.5" dir="rtl">
                  {(m.normalized_attempt ?? []).map((word, i) => (
                    <span key={i} className={`${BASE_CHIP} bg-zinc-900 border-zinc-700 text-zinc-200`}>
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            );
          }

          const tokens   = tokensForPhase(m);
          const infoTags = infoForPhase(m);
          const metaTags = m.split_merge_metadata ?? [];
          const showMeta = phase === "meta-color" || phase === "done";

          return (
            <div key={model} className="space-y-2">
              <p className="text-zinc-600 uppercase font-mono text-xs">{model}</p>
              <div className="flex flex-wrap gap-1.5" dir="rtl">
                {tokens.map((word, i) => {
                  const scanned  = phase !== "sieve" || i < sievePos;
                  const isCursor = phase === "sieve" && i === sievePos;
                  const isOOV    = scanned && !!oovResult?.oov_dict.includes(word);
                  const isActive = activeToken === word;
                  const info     = infoTags[i]  ?? "MATCH";
                  const meta     = metaTags?.[i] ?? "SAME";
                  return renderChip(word, i, info, meta, scanned, isCursor, isOOV, isActive, showMeta);
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* oov candidate panel */}
      {activeToken && oovResult?.metadata[activeToken] && (
        <div className="rounded-xl border border-rose-900 bg-zinc-950 overflow-hidden">
          <div className="p-3 border-b border-rose-900 bg-rose-950/20 text-rose-400">
            candidates: <span className="font-urdu text-rose-200 text-lg ml-2">{activeToken}</span>
          </div>
          <table className="w-full text-center">
            <thead className="text-zinc-500 border-b border-zinc-800">
              <tr>{oovResult.columns.map(c => <th key={c} className="p-2 font-normal">{c}</th>)}</tr>
            </thead>
            <tbody className="text-zinc-400">
              {Object.entries(oovResult.metadata[activeToken]).map(([word, meta], i) => {
                const vals = meta as (string | number)[];
                return (
                  <tr key={word} className={`border-b border-zinc-900 ${i === 0 ? "bg-zinc-900/40" : ""}`}>
                    <td className="p-2 font-urdu text-right text-zinc-100">{word}</td>
                    <td className="p-2"><span className="px-1.5 rounded bg-zinc-800">{vals[0]}</span></td>
                    <td className="p-2">{vals[1]}/3</td>
                    <td className="p-2">{vals[2]}/2</td>
                    <td className="p-2">{vals[3]}</td>
                    <td className="p-2">{vals[4] || "—"}</td>
                    <td className="p-2">{vals[5] || "—"}</td>
                    <td className="p-2">{vals[6] || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* apply button */}
      {phase === "done" && oovResult && (
        <button
          onClick={() => onOOVResult(oovResult)}
          className="w-full rounded-lg bg-teal-950 border border-teal-800 py-3 text-teal-300 font-mono font-semibold text-sm uppercase tracking-widest hover:bg-teal-900 transition-colors"
        >
          APPLY CORRECTION →
        </button>
      )}
    </div>
  );
}