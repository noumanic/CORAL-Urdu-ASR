"use client";
import { useState, useEffect, useRef } from "react";
import { AlignInfo, OOVResult, ModelAlign, InfoTag, MetaTag, normaliseInfoTags } from "./lib/api";

interface Props {
  alignInfo:   AlignInfo;
  models:      string[];
  onOOVResult: (result: OOVResult) => void;
}

type Phase    = "sieve" | "word-color" | "expand" | "meta-color" | "done";
type ViewMode = "word" | "character";

// ── channel 1: text color — semantic correctness ──────────────────────────────
function infoTextClass(tag: InfoTag): string {
  switch (tag) {
    case "MATCH":        return "text-emerald-400";
    case "INSERTION":    return "text-yellow-400";
    case "DELETION":     return "text-red-400";
    case "SUBSTITUTION": return "text-amber-400";
    default:             return "text-zinc-300";
  }
}

// ── channel 2: border — structural role (character mode only) ─────────────────
function metaBorderClass(tag: MetaTag): string {
  switch (tag) {
    case "SPLIT": return "border-2 border-pink-500";
    case "MERGE": return "border-2 border-purple-500";
    case "NOISE": return "border border-dashed border-zinc-500";
    case "SAME":  return "border border-zinc-700";
    default:      return "border border-zinc-700";
  }
}

// ── hover glow matched to info tag ───────────────────────────────────────────
function infoHoverGlow(tag: InfoTag): string {
  switch (tag) {
    case "MATCH":        return "hover:shadow-[0_0_10px_rgba(52,211,153,0.4)] hover:border-emerald-600";
    case "INSERTION":    return "hover:shadow-[0_0_10px_rgba(250,204,21,0.35)] hover:border-yellow-600";
    case "DELETION":     return "hover:shadow-[0_0_10px_rgba(248,113,113,0.35)] hover:border-red-600";
    case "SUBSTITUTION": return "hover:shadow-[0_0_10px_rgba(251,191,36,0.35)] hover:border-amber-600";
    default:             return "hover:border-zinc-500";
  }
}

function metaLabel(tag: MetaTag): string {
  switch (tag) {
    case "SPLIT": return "spl";
    case "MERGE": return "mrg";
    case "NOISE": return "nse";
    default:      return "";
  }
}

const BASE_CHIP =
  "relative inline-flex items-center px-2.5 py-1 rounded-md font-urdu text-sm " +
  "bg-zinc-900 transition-all duration-200 ease-out " +
  "hover:scale-105 hover:-translate-y-0.5 active:scale-95";

export default function Pass2Sieve({ alignInfo, models, onOOVResult }: Props) {
  const [phase,       setPhase]       = useState<Phase>("sieve");
  const [sievePos,    setSievePos]    = useState<number>(0);
  const [oovResult,   setOovResult]   = useState<OOVResult | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  const [viewMode,    setViewMode]    = useState<ViewMode>("word");
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
    setViewMode("word");
    fetchOOV();

    timerRef.current = setInterval(() => {
      setSievePos(p => {
        if (p >= maxLen) {
          clearInterval(timerRef.current!);
          setPhase("word-color");
          setTimeout(() => {
            setPhase("expand");
            setViewMode("character");
            setTimeout(() => {
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

  // ── strictly paired arrays by view mode ──────────────────────────────────
  function tokensForMode(m: ModelAlign): string[] {
    return viewMode === "character"
      ? (m.split_merge_aligned_attempt ?? m.aligned_attempt ?? [])
      : (m.aligned_attempt ?? []);
  }

  function infoForMode(m: ModelAlign): InfoTag[] {
    return viewMode === "character"
      ? (m.split_merge_aligned_info ?? normaliseInfoTags(m.aligned_info ?? []))
      : normaliseInfoTags(m.aligned_info ?? []);
  }

  function metaForMode(m: ModelAlign): MetaTag[] {
    return viewMode === "character" ? (m.split_merge_metadata ?? []) : [];
  }

  const showMeta  = viewMode === "character" && (phase === "meta-color" || phase === "done");
  const isDone    = phase === "done";
  const progressPct = maxLen > 0 ? Math.min((sievePos / maxLen) * 100, 100) : 0;

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
  ) {
    if (!scanned) {
      return (
        <span key={idx} className={`${BASE_CHIP} border border-zinc-800 text-zinc-700`}>
          {word || "∅"}
        </span>
      );
    }

    if (isCursor) {
      return (
        <span
          key={idx}
          className={`${BASE_CHIP} !bg-violet-900/60 border-2 border-violet-400 text-violet-100 scale-110 -translate-y-1 shadow-[0_0_16px_rgba(139,92,246,0.7)]`}
        >
          {word || "∅"}
        </span>
      );
    }

    const borderCls   = showMeta ? metaBorderClass(meta) : "border border-zinc-700";
    const textCls     = infoTextClass(info);
    const hoverCls    = infoHoverGlow(info);
    const deletionCls = info === "DELETION" ? "opacity-50 line-through decoration-red-500/60" : "";
    const label       = showMeta ? metaLabel(meta) : "";

    // channel 3: OOV — dotted underline, independent of border and text color
    const oovCls = isOOV
      ? `underline decoration-dotted decoration-rose-500 underline-offset-4 cursor-pointer ${
          isActive ? "ring-1 ring-rose-500/50 ring-offset-1 ring-offset-zinc-950" : ""
        }`
      : "cursor-default";

    return (
      <button
        key={idx}
        onClick={() => isOOV && setActiveToken(isActive ? null : word)}
        title={isOOV ? "OOV — click for candidates" : undefined}
        className={[BASE_CHIP, borderCls, textCls, hoverCls, deletionCls, oovCls].join(" ")}
      >
        {word || "∅"}
        {label && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-mono tracking-wider opacity-60 pointer-events-none select-none">
            {label}
          </span>
        )}
      </button>
    );
  }

  // ── phase status config ───────────────────────────────────────────────────
  const phaseStatus = {
    "sieve":      { label: "scanning",           dot: "bg-violet-400 animate-pulse",  text: "text-violet-300"  },
    "word-color": { label: "coloring matches",   dot: "bg-emerald-400 animate-pulse", text: "text-emerald-300" },
    "expand":     { label: "expanding tokens",   dot: "bg-yellow-400 animate-pulse",  text: "text-yellow-300"  },
    "meta-color": { label: "applying structure", dot: "bg-pink-400 animate-pulse",    text: "text-pink-300"    },
    "done":       { label: "scan complete",      dot: "bg-emerald-400",               text: "text-emerald-300" },
  } as const;
  const ps = phaseStatus[phase];

  return (
    <div className="space-y-4 font-mono text-xs">

      {/* ── top bar: status + toggle + re-run ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ps.dot}`} />
          {isLoading && <span className="text-violet-300 animate-pulse mr-1">oov...</span>}
          <span className={ps.text}>{ps.label}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* word / character toggle — locked until done */}
          <div className={`flex rounded-lg border overflow-hidden transition-all duration-300 ${
            isDone ? "border-zinc-700" : "border-zinc-800 opacity-30 pointer-events-none"
          }`}>
            {(["word", "character"] as ViewMode[]).map(m => (
              <button
                key={m}
                disabled={!isDone}
                onClick={() => setViewMode(m)}
                className={[
                  "px-3 py-1 text-[10px] tracking-widest uppercase transition-all duration-200",
                  viewMode === m
                    ? "bg-zinc-700 text-zinc-100"
                    : "bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
                ].join(" ")}
              >
                {m}
              </button>
            ))}
          </div>

          {isDone && (
            <button
              onClick={runPipeline}
              className="text-zinc-500 hover:text-violet-400 transition-all duration-500 hover:rotate-180 inline-block"
              title="re-run"
            >
              ↺
            </button>
          )}
        </div>
      </div>

      {/* ── progress bar with glowing head ── */}
      <div className="relative h-px bg-zinc-800 overflow-visible mx-0.5">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-700 via-violet-500 to-violet-400 transition-all duration-150 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
        {phase === "sieve" && progressPct > 0 && progressPct < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-violet-300 shadow-[0_0_10px_4px_rgba(167,139,250,0.7)] transition-all duration-150"
            style={{ left: `calc(${progressPct}% - 5px)` }}
          />
        )}
      </div>

      {/* ── legend ── */}
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/60 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-600 w-[72px] shrink-0 text-[10px] uppercase tracking-widest">semantic</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-emerald-400">match</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-yellow-400">insertion</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-red-400 line-through decoration-red-500/60">deletion</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-400">substitution</span>
        </div>
        <div className="h-px bg-zinc-800/50" />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-600 w-[72px] shrink-0 text-[10px] uppercase tracking-widest">structure</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border-2 border-pink-500   text-zinc-300">split</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border-2 border-purple-500 text-zinc-300">merge</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border   border-zinc-700   text-zinc-400">same</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border   border-dashed border-zinc-500 text-zinc-400">noise</span>
          <span className="text-zinc-700 text-[10px] ml-1">(character mode only)</span>
        </div>
        <div className="h-px bg-zinc-800/50" />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-600 w-[72px] shrink-0 text-[10px] uppercase tracking-widest">oov</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 underline decoration-dotted decoration-rose-500 underline-offset-4">
            unknown word
          </span>
          <span className="text-zinc-600">→ click for candidates</span>
        </div>
      </div>

      {/* ── view mode label ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-[10px] uppercase tracking-widest text-zinc-600 px-1">
          {viewMode === "word" ? "word-level" : "character-level"}
        </span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      {/* ── model rows ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800/50">
        {models.map(model => {
          const m   = alignInfo[model] as ModelAlign;
          const src = model === alignInfo.source_model;

          if (src) {
            return (
              <div key={model} className="px-4 py-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase tracking-widest text-cyan-500 border border-cyan-900/60 rounded px-1.5 py-0.5">source</span>
                  <span className="text-zinc-500">{model}</span>
                </div>
                <div className="flex flex-wrap gap-1.5" dir="rtl">
                  {(m.normalized_attempt ?? []).map((word, i) => (
                    <span
                      key={i}
                      className={`${BASE_CHIP} border border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:text-zinc-100 hover:shadow-[0_0_8px_rgba(255,255,255,0.06)]`}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            );
          }

          const tokens   = tokensForMode(m);
          const infoTags = infoForMode(m);
          const metaTags = metaForMode(m);

          // match rate badge
          const totalTagged = infoTags.filter(Boolean).length;
          const matchCount  = infoTags.filter(t => t === "MATCH").length;
          const matchPct    = totalTagged > 0 ? Math.round((matchCount / totalTagged) * 100) : null;

          return (
            <div key={model} className="px-4 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">{model}</span>
                {isDone && matchPct !== null && (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono ${
                    matchPct >= 90
                      ? "border-emerald-800/60 text-emerald-400 bg-emerald-950/30"
                      : matchPct >= 70
                      ? "border-amber-800/60 text-amber-400 bg-amber-950/30"
                      : "border-red-800/60 text-red-400 bg-red-950/30"
                  }`}>
                    {matchPct}% match
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5" dir="rtl">
                {tokens.map((word, i) => {
                  const scanned  = phase !== "sieve" || i < sievePos;
                  const isCursor = phase === "sieve" && i === sievePos;
                  const isOOV    = scanned && !!oovResult?.oov_dict.includes(word);
                  const isActive = activeToken === word;
                  const info     = infoTags[i] ?? "MATCH";
                  const meta     = metaTags[i] ?? "SAME";
                  return renderChip(word, i, info, meta, scanned, isCursor, isOOV, isActive);
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── oov candidate panel ── */}
      {activeToken && oovResult?.metadata[activeToken] && (
        <div className="rounded-xl border border-rose-900/50 bg-zinc-950 overflow-hidden">
          <div className="px-4 py-3 border-b border-rose-900/40 bg-gradient-to-r from-rose-950/20 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-400 tracking-widest">oov candidates</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-urdu text-rose-200 text-base">{activeToken}</span>
              <button
                onClick={() => setActiveToken(null)}
                className="text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="border-b border-zinc-800">
                <tr>
                  {oovResult.columns.map(c => (
                    <th key={c} className="px-3 py-2 text-[10px] uppercase tracking-widest text-zinc-600 font-normal">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                {Object.entries(oovResult.metadata[activeToken]).map(([word, meta], i) => {
                  const vals = meta as (string | number)[];
                  return (
                    <tr
                      key={word}
                      className={`border-b border-zinc-900/60 transition-colors hover:bg-zinc-900/60 ${
                        i === 0 ? "bg-rose-950/10" : ""
                      }`}
                    >
                      <td className="px-3 py-2 font-urdu text-right text-zinc-100 text-sm">{word}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs">{vals[0]}</span>
                      </td>
                      <td className="px-3 py-2 text-xs">{vals[1]}/3</td>
                      <td className="px-3 py-2 text-xs">{vals[2]}/2</td>
                      <td className="px-3 py-2 text-xs">{vals[3]}</td>
                      <td className="px-3 py-2 text-xs">{vals[4] || "—"}</td>
                      <td className="px-3 py-2 text-xs">{vals[5] || "—"}</td>
                      <td className="px-3 py-2 text-xs">{vals[6] || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── apply button ── */}
      {isDone && oovResult && (
        <button
          onClick={() => onOOVResult(oovResult)}
          className="group w-full rounded-xl bg-teal-950 border border-teal-800/60 py-3.5 font-mono font-semibold text-sm uppercase tracking-widest text-teal-300 hover:bg-teal-900/80 hover:border-teal-700 hover:text-teal-200 hover:shadow-[0_0_28px_rgba(20,184,166,0.12)] transition-all duration-300 flex items-center justify-center gap-3"
        >
          <span>Apply Correction</span>
          <span className="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
        </button>
      )}
    </div>
  );
}