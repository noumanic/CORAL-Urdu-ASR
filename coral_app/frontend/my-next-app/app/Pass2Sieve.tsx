"use client";
import { useState, useEffect, useRef } from "react";
import { AlignInfo, OOVResult, CandidateMeta } from "./lib/api";



const MATCH_COLOR: Record<number, string> = {
  0: "border-emerald-700 bg-emerald-950 text-emerald-200",
  1: "border-blue-700   bg-blue-950   text-blue-200",
  2: "border-red-700    bg-red-950    text-red-200",
  3: "border-amber-700  bg-amber-950  text-amber-200",
};

const SIEVE_DELAY_MS = 220;

interface Props {
  alignInfo:   AlignInfo;
  models:      string[];
  onOOVResult: (result: OOVResult) => void;
}

export default function Pass2Sieve({ alignInfo, models, onOOVResult }: Props) {
  const source      = alignInfo.source_model as string;
  const maxLen      = Math.max(...models.map(m => {
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const opacityClass = (agreement: number) => {
    if (agreement >= 4) return "opacity-100";
    if (agreement === 3) return "opacity-75";
    if (agreement === 2) return "opacity-50";
    return "opacity-30";
  };

  const fetchOOV = async () => {
    setLoading(true);
    setError(null);
    try {
      const { api } = await import("./lib/api");
      const result = await api.oov({ align_info: alignInfo, freq_cutoff: 2000, depth: 50, top_n: 8 });
      setOovResult(result);
      onOOVResult(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OOV fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const startSieve = async () => {
    setDone(false);
    setOovResult(null);
    setActiveToken(null);
    setRunning(true);
    setSievePos(0);
    await fetchOOV();
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSievePos(p => {
        if (p === null) return null;
        if (p >= maxLen - 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setDone(true);
          return null;
        }
        return p + 1;
      });
    }, SIEVE_DELAY_MS);
    return () => clearInterval(intervalRef.current!);
  }, [running, maxLen]);

  const isOOV = (word: string) => oovResult?.oov_dict.includes(word) ?? false;

  return (
    <div className="space-y-6">
      {/* legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-950 border border-emerald-700 inline-block" />Match</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-950  border border-amber-700  inline-block" />Substitution</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-950    border border-red-700    inline-block" />Deletion</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-950   border border-blue-700   inline-block" />Insertion</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-6 border-b-2 border-dashed border-rose-500" />OOV</span>
        <span className="flex items-center gap-1.5">
          <span className="opacity-100 text-zinc-300 text-xs">▉</span>
          <span className="opacity-50 text-zinc-300 text-xs">▉</span>
          <span className="opacity-25 text-zinc-300 text-xs">▉</span>
          Agreement
        </span>
      </div>

      <button
        onClick={startSieve}
        disabled={running || loading}
        className="w-full rounded-lg border border-violet-800 bg-violet-950 py-3 text-sm font-mono font-semibold text-violet-300 uppercase tracking-widest transition-all hover:bg-violet-900 hover:border-violet-600 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "FETCHING OOV DATA..." : running ? "SCANNING..." : "RUN SIEVE SCAN →"}
      </button>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300 font-mono">
          {error}
        </p>
      )}

      {(running || done) && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              {running ? "Scanning all models..." : "Scan complete — click OOV tokens to inspect"}
            </p>
          </div>

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
                      const oov       = scanned && isOOV(word);
                      const agreement = scanned ? agreementAt(i) : 4;
                      const active    = activeToken === word;

                      return (
                        <button
                          key={i}
                          onClick={() => oov ? setActiveToken(active ? null : word) : undefined}
                          disabled={!oov}
                          className={[
                            "relative px-2 py-1 rounded font-urdu text-sm border transition-all duration-150",
                            isCurrent
                              ? "border-violet-400 bg-violet-900 text-violet-100 scale-110 shadow-lg shadow-violet-900/60 z-10"
                              : scanned
                              ? `${MATCH_COLOR[mtype]} ${opacityClass(agreement)}`
                              : "border-zinc-800 bg-zinc-900 text-zinc-600",
                            oov && !isCurrent ? "cursor-pointer hover:brightness-125" : "",
                            active ? "ring-2 ring-rose-400 ring-offset-1 ring-offset-zinc-950" : "",
                          ].join(" ")}
                          style={oov && scanned ? {
                            textDecoration:        "underline",
                            textDecorationStyle:   "dashed",
                            textDecorationColor:   "#f43f5e",
                            textUnderlineOffset:   "4px",
                          } : undefined}
                        >
                            {word === '' || word === null? <span className="text-red-700 text-xs">∅</span>: word}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {running && sievePos !== null && (
            <div className="mx-4 mb-4 h-0.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-200"
                style={{ width: `${((sievePos + 1) / maxLen) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* candidate inspector */}
      {activeToken && oovResult?.metadata[activeToken] && (
        <CandidatePanel token={activeToken} metadata={oovResult.metadata[activeToken]} />
      )}

      {/* OOV summary */}
      {done && oovResult && oovResult.oov_dict.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
            {oovResult.oov_dict.length} OOV token{oovResult.oov_dict.length !== 1 ? "s" : ""} flagged — click to inspect
          </p>
          <div className="flex flex-wrap gap-2" dir="rtl">
            {oovResult.oov_dict.map(word => (
              <button
                key={word}
                onClick={() => setActiveToken(activeToken === word ? null : word)}
                className={`px-3 py-1.5 rounded-lg font-urdu text-sm border transition-colors ${
                  activeToken === word
                    ? "border-rose-400 bg-rose-900 text-rose-100"
                    : "border-rose-800 bg-rose-950 text-rose-400 hover:border-rose-600"
                }`}
                style={{
                  textDecoration:      "underline",
                  textDecorationStyle: "dashed",
                  textDecorationColor: "#f43f5e",
                  textUnderlineOffset: "4px",
                }}
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
    </div>
  );
}

function CandidatePanel({ token, metadata }: { token: string; metadata: Record<string, CandidateMeta> }) {
  return (
    <div className="rounded-xl border border-rose-900 bg-zinc-950 overflow-hidden">
      <div className="px-4 py-3 border-b border-rose-900 bg-rose-950/20 flex items-center gap-3">
        <p className="font-mono text-xs text-rose-400 uppercase tracking-widest">Candidates for</p>
        <span
          className="font-urdu text-rose-200 text-lg"
          style={{ textDecoration: "underline", textDecorationStyle: "dashed", textDecorationColor: "#f43f5e", textUnderlineOffset: "4px" }}
        >
          {token}
        </span>
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
              <th className="px-4 py-2 text-right font-normal">Tri Freq</th>
              <th className="px-4 py-2 text-right font-normal">Bi Freq</th>
              <th className="px-4 py-2 text-right font-normal">Uni Freq</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(metadata).map(([word, meta], i) => {
              const [dist, tri, bi, uni, triFreq, biFreq, uniFreq] = meta;
              const isTop = i === 0;
              return (
                <tr key={word} className={`border-b border-zinc-900 ${isTop ? "bg-zinc-900/60" : "hover:bg-zinc-900/20"}`}>
                  <td className="px-4 py-2 text-right font-urdu text-base">
                    {isTop && <span className="mr-2 text-xs text-amber-400">★</span>}
                    <span className={isTop ? "text-zinc-100" : "text-zinc-400"}>{word}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-1.5 rounded text-xs ${dist === 0 ? "text-emerald-400" : dist === 1 ? "text-amber-400" : "text-red-400"}`}>
                      {dist}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-zinc-400">{tri}/3</td>
                  <td className="px-3 py-2 text-center text-zinc-400">{bi}/2</td>
                  <td className="px-3 py-2 text-center text-zinc-400">{uni}</td>
                  <td className="px-4 py-2 text-right text-zinc-500">{triFreq > 0 ? triFreq.toLocaleString() : "—"}</td>
                  <td className="px-4 py-2 text-right text-zinc-500">{biFreq > 0 ? biFreq.toLocaleString() : "—"}</td>
                  <td className="px-4 py-2 text-right text-zinc-500">{uniFreq > 0 ? uniFreq.toLocaleString() : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
