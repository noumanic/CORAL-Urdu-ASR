"use client";
import { useState, useEffect, useRef } from "react";
import { AlignInfo, OOVResult, CandidateMeta } from "./lib/api";

const SK = { oovResult: "coral_p2_oovResult", done: "coral_p2_done" };
function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

const SIEVE_DELAY_MS = 180;

const AGREEMENT_RING: Record<number, string> = {
  4: "",
  3: "ring-1 ring-zinc-600/40",
  2: "ring-1 ring-zinc-600/20",
  1: "ring-1 ring-zinc-600/10 opacity-60",
};

const MATCH_COLOR: Record<number, string> = {
  0: "border-emerald-700 bg-emerald-950 text-emerald-200",
  1: "border-blue-700   bg-blue-950   text-blue-200",
  2: "border-red-700    bg-red-950    text-red-200",
  3: "border-amber-700  bg-amber-950  text-amber-200",
};

interface Props {
  alignInfo:   AlignInfo;
  models:      string[];
  onOOVResult: (result: OOVResult) => void;
  isActive:    boolean;
}

export default function Pass2Sieve({ alignInfo, models, onOOVResult }: Props) {
  const source = alignInfo.source_model as string;
  const maxLen = Math.max(...models.map(m => {
    const d = alignInfo[m] as { attempt_alignment: string[] };
    return d?.attempt_alignment.length ?? 0;
  }));

  const [sievePos,    setSievePos]    = useState<number | null>(null);
  const [running,     setRunning]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [oovResult,   setOovResult]   = useState<OOVResult | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const animStarted  = useRef(false);

  useEffect(() => {
    animStarted.current = false;
    setDone(false);
    setOovResult(null);
    setActiveToken(null);
    setSievePos(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const timer = setTimeout(() => {
      setSievePos(0);
      setRunning(true);
    }, 1000);
    fetchOOV();
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alignInfo]);

  useEffect(() => { lsSet(SK.oovResult, oovResult); }, [oovResult]);
  useEffect(() => { lsSet(SK.done,      done);      }, [done]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSievePos(p => {
        if (p === null) return null;
        if (p >= maxLen) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setDone(true);
          return p;
        }
        return p + 1;
      });
    }, SIEVE_DELAY_MS);
    return () => clearInterval(intervalRef.current!);
  }, [running, maxLen]);

  // Pure OOV fetch — no animation logic, just fetch and store result
  const fetchOOV = async () => {
    setOovResult(null);
    setError(null);
    setLoading(true);
    try {
      const { api } = await import("./lib/api");
      const result  = await api.oov({ align_info: alignInfo, freq_cutoff: 2000, depth: 50, top_n: 8 });
      setOovResult(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OOV fetch failed");
    } finally {
      setLoading(false);
    }
  };

  // Re-run: restart animation immediately + refetch OOV fresh — both decoupled
  const runSieve = () => {
    setDone(false);
    setOovResult(null);
    setActiveToken(null);
    setError(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSievePos(0);
    setRunning(true);
    fetchOOV();
  };

  const handleProceed = () => {
    if (oovResult) onOOVResult(oovResult);
  };

  const agreementAt = (pos: number): number => {
    const words = models.map(m => {
      const d = alignInfo[m] as { attempt_alignment: string[] };
      return d?.attempt_alignment[pos] ?? null;
    }).filter(Boolean);
    if (!words.length) return 0;
    const counts = words.reduce<Record<string, number>>((acc, w) => {
      acc[w!] = (acc[w!] ?? 0) + 1; return acc;
    }, {});
    return Math.max(...Object.values(counts));
  };

  const isOOV    = (word: string) => oovResult?.oov_dict.includes(word) ?? false;
  const progress = sievePos !== null ? ((sievePos + 1) / maxLen) * 100 : done ? 100 : 0;

  return (
    <div className="space-y-5">

      {/* status bar */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center gap-4">
        {loading && (
          <span className="flex items-center gap-2 font-mono text-xs text-violet-400">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Fetching OOV data...
          </span>
        )}
        {running && !loading && (
          <span className="flex items-center gap-2 font-mono text-xs text-violet-400">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
            Scanning...
          </span>
        )}
        {done && !running && (
          <span className="flex items-center gap-2 font-mono text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Scan complete
            {oovResult && (
              <span className="text-zinc-500">
                · {oovResult.oov_dict.length} OOV token{oovResult.oov_dict.length !== 1 ? "s" : ""} flagged
              </span>
            )}
          </span>
        )}
        {!loading && !running && !done && (
          <span className="font-mono text-xs text-zinc-600">Initialising...</span>
        )}
        <div className="flex-1" />
        {done && (
          <button onClick={runSieve} disabled={loading || running}
            className="px-3 py-1 rounded border border-zinc-700 text-xs font-mono text-zinc-500 hover:border-violet-700 hover:text-violet-400 transition-colors disabled:opacity-40">
            ↺ Re-run
          </button>
        )}
      </div>

      {/* progress bar */}
      <div className="h-0.5 rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full bg-violet-500 transition-all duration-150" style={{ width: `${progress}%` }} />
      </div>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300 font-mono">{error}</p>
      )}

      {/* legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-xs text-zinc-600">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-950 border border-emerald-700 inline-block" />Match</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-950  border border-amber-700  inline-block" />Sub</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-950    border border-red-700    inline-block" />Del</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-950   border border-blue-700   inline-block" />Ins</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-b-2 border-dashed border-rose-500" />OOV</span>
        <span className="flex items-center gap-1.5 text-zinc-700">faded = low model agreement</span>
      </div>

      {/* token grid */}
      {(running || done || loading) && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="p-4 space-y-5">
            {models.map(model => {
              const mdata = alignInfo[model] as { attempt_alignment: string[]; attempt_matchinfo: number[] };
              if (!mdata) return null;
              const isSource = model === source;
              return (
                <div key={model} className="space-y-1.5">
                  <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
                    {isSource ? `★ ${model}` : model}
                  </p>
                  <div className="flex flex-wrap gap-1.5" dir="rtl">
                    {mdata.attempt_alignment.map((word, i) => {
                      const mtype     = mdata.attempt_matchinfo[i] ?? 0;
                      const isCurrent = sievePos === i;
                      const scanned   = done || (sievePos !== null && i < sievePos);
                      const oov       = scanned && word !== "" && isOOV(word);
                      const agreement = scanned ? Math.min(agreementAt(i), 4) : 4;
                      const active    = activeToken === word;
                      const ringClass = AGREEMENT_RING[agreement] ?? AGREEMENT_RING[1];
                      return (
                        <button
                          key={i}
                          onClick={() => oov ? setActiveToken(active ? null : word) : undefined}
                          disabled={!oov}
                          title={oov ? "OOV — click to inspect" : undefined}
                          className={[
                            "relative px-2 py-1 rounded font-urdu text-sm border transition-all duration-150",
                            isCurrent
                              ? "border-violet-400 bg-violet-900 text-violet-100 scale-110 shadow-lg shadow-violet-900/60 z-10"
                              : scanned
                              ? `${MATCH_COLOR[mtype]} ${ringClass}`
                              : "border-zinc-800 bg-zinc-900/50 text-zinc-700",
                            oov && !isCurrent ? "cursor-pointer hover:brightness-125" : "cursor-default",
                            active ? "ring-2 ring-rose-400 ring-offset-1 ring-offset-zinc-950" : "",
                          ].join(" ")}
                          style={oov && scanned ? {
                            textDecoration:      "underline",
                            textDecorationStyle: "dashed",
                            textDecorationColor: "#f43f5e",
                            textUnderlineOffset: "4px",
                          } : undefined}
                        >
                          {!word ? <span className="text-zinc-700 text-xs">∅</span> : word}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* candidate inspector */}
      {activeToken && oovResult?.metadata[activeToken] && (
        <CandidatePanel token={activeToken} metadata={oovResult.metadata[activeToken]} />
      )}

      {/* OOV summary chips */}
      {done && oovResult && oovResult.oov_dict.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
            Flagged OOV tokens — click to inspect
          </p>
          <div className="flex flex-wrap gap-2" dir="rtl">
            {oovResult.oov_dict.map(word => (
              <button key={word}
                onClick={() => setActiveToken(activeToken === word ? null : word)}
                className={`px-3 py-1.5 rounded-lg font-urdu text-sm border transition-colors ${
                  activeToken === word
                    ? "border-rose-400 bg-rose-900 text-rose-100"
                    : "border-rose-800 bg-rose-950 text-rose-400 hover:border-rose-600"
                }`}
                style={{ textDecoration:"underline", textDecorationStyle:"dashed", textDecorationColor:"#f43f5e", textUnderlineOffset:"4px" }}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {done && oovResult && oovResult.oov_dict.length === 0 && (
        <p className="text-sm font-mono text-emerald-400">✓ No OOV tokens detected</p>
      )}

      {/* apply correction button — only shown when scan is done */}
      {done && oovResult && (
        <button
          onClick={handleProceed}
          className="w-full rounded-lg border border-teal-800 bg-teal-950 py-3 text-sm font-mono font-semibold text-teal-300 uppercase tracking-widest transition-all hover:bg-teal-900 hover:border-teal-600"
        >
          APPLY CORRECTION →
        </button>
      )}
    </div>
  );
}

function CandidatePanel({ token, metadata }: { token: string; metadata: Record<string, CandidateMeta> }) {
  const entries = Object.entries(metadata);
  const maxUni  = Math.max(...entries.map(([, m]) => m[6] ?? 0), 1);
  return (
    <div className="rounded-xl border border-rose-900 bg-zinc-950 overflow-hidden">
      <div className="px-4 py-3 border-b border-rose-900 bg-rose-950/20 flex items-center gap-3">
        <p className="font-mono text-xs text-rose-400 uppercase tracking-widest">Candidates for</p>
        <span className="font-urdu text-rose-200 text-lg"
          style={{ textDecoration:"underline", textDecorationStyle:"dashed", textDecorationColor:"#f43f5e", textUnderlineOffset:"4px" }}>
          {token}
        </span>
        <span className="font-mono text-xs text-zinc-600 ml-auto">{entries.length} candidates</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500">
              <th className="px-4 py-2 text-right font-normal">Word</th>
              <th className="px-3 py-2 text-center font-normal">Dist</th>
              <th className="px-3 py-2 text-center font-normal">Tri</th>
              <th className="px-3 py-2 text-center font-normal">Bi</th>
              <th className="px-3 py-2 text-center font-normal">Uni</th>
              <th className="px-4 py-2 text-left font-normal text-zinc-600">Frequency</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([word, meta], i) => {
              const [dist, tri, bi, uni, , , uniFreq] = meta;
              const isTop  = i === 0;
              const barPct = uniFreq > 0 ? (uniFreq / maxUni) * 100 : 0;
              return (
                <tr key={word} className={`border-b border-zinc-900 ${isTop ? "bg-zinc-900/60" : "hover:bg-zinc-900/20"}`}>
                  <td className="px-4 py-2 text-right font-urdu text-base">
                    {isTop && <span className="mr-2 text-xs text-amber-400">★</span>}
                    <span className={isTop ? "text-zinc-100" : "text-zinc-400"}>{word}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-1.5 rounded text-xs font-semibold ${
                      dist === 0 ? "text-emerald-400 bg-emerald-950" :
                      dist === 1 ? "text-amber-400 bg-amber-950" :
                                   "text-red-400 bg-red-950"
                    }`}>{dist}</span>
                  </td>
                  <td className="px-3 py-2 text-center text-zinc-500 tabular-nums">{tri}/3</td>
                  <td className="px-3 py-2 text-center text-zinc-500 tabular-nums">{bi}/2</td>
                  <td className="px-3 py-2 text-center text-zinc-500 tabular-nums">{uni}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full bg-violet-600 transition-all" style={{ width: `${barPct}%` }} />
                      </div>
                      <span className="text-zinc-600 tabular-nums text-xs">
                        {uniFreq > 0 ? uniFreq.toLocaleString() : "—"}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
