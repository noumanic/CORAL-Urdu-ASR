
import { useState, useEffect, useRef } from "react";
import { AlignInfo, OOVResult, OOVMetadata, CandidateMeta } from "./lib/api";

interface Props {
  alignInfo: AlignInfo;
  onOOVResult: (result: OOVResult) => void;
}

const SIEVE_DELAY_MS = 180;

export default function Pass2Sieve({ alignInfo, onOOVResult }: Props) {
  const source       = alignInfo.source_model as string;
  const sourceWords  = (alignInfo[source] as { normalized_attempt: string[] }).normalized_attempt;

  const [sievePos,    setSievePos]    = useState<number | null>(null);
  const [running,     setRunning]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [oovResult,   setOovResult]   = useState<OOVResult | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        if (p >= sourceWords.length - 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setDone(true);
          return null;
        }
        return p + 1;
      });
    }, SIEVE_DELAY_MS);
    return () => clearInterval(intervalRef.current!);
  }, [running, sourceWords.length]);

  const isOOV = (word: string) => oovResult?.oov_dict.includes(word) ?? false;

  return (
    <div className="space-y-6">
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

      {/* sieve animation */}
      {(running || done) && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="mb-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">
            {running ? "Scanning tokens..." : "Scan complete — click OOV tokens to inspect"}
          </p>
          <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
            {sourceWords.map((word, i) => {
              const isCurrent = sievePos === i;
              const scanned   = done || (sievePos !== null && i < sievePos);
              const oov       = scanned && isOOV(word);
              const active    = activeToken === word;

              return (
                <button
                  key={i}
                  onClick={() => oov && setActiveToken(active ? null : word)}
                  className={[
                    "relative px-3 py-2 rounded-lg font-urdu text-base border transition-all duration-200",
                    isCurrent
                      ? "border-violet-500 bg-violet-900 text-violet-100 scale-110 shadow-lg shadow-violet-900/50 z-10"
                      : oov
                      ? active
                        ? "border-rose-400 bg-rose-900 text-rose-100 shadow-lg shadow-rose-900/50 cursor-pointer"
                        : "border-rose-700 bg-rose-950 text-rose-300 cursor-pointer hover:border-rose-500 hover:bg-rose-900"
                      : scanned
                      ? "border-emerald-900 bg-emerald-950 text-emerald-300"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400",
                  ].join(" ")}
                >
                  {word}
                  {oov && (
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-rose-500 border border-zinc-950" />
                  )}
                </button>
              );
            })}
          </div>

          {/* sieve progress bar */}
          {running && sievePos !== null && (
            <div className="mt-4 h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-150"
                style={{ width: `${((sievePos + 1) / sourceWords.length) * 100}%` }}
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
      {done && oovResult && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
            OOV Summary — {oovResult.oov_dict.length} token{oovResult.oov_dict.length !== 1 ? "s" : ""} flagged
          </p>
          <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
            {oovResult.oov_dict.map(word => (
              <button
                key={word}
                onClick={() => setActiveToken(activeToken === word ? null : word)}
                className={`px-3 py-1.5 rounded-lg font-urdu text-sm border transition-colors ${
                  activeToken === word
                    ? "border-rose-400 bg-rose-900 text-rose-100"
                    : "border-rose-800 bg-rose-950 text-rose-400 hover:border-rose-600"
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CandidatePanel({ token, metadata }: { token: string; metadata: Record<string, CandidateMeta> }) {
  return (
    <div className="rounded-xl border border-rose-900 bg-zinc-950 overflow-hidden">
      <div className="px-4 py-3 border-b border-rose-900 bg-rose-950/30">
        <p className="font-mono text-xs text-rose-400 uppercase tracking-widest">
          Candidates for <span className="font-urdu text-rose-200 text-base normal-case">{token}</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-2 text-right text-zinc-500 font-normal">Word</th>
              <th className="px-3 py-2 text-center text-zinc-500 font-normal">Dist</th>
              <th className="px-3 py-2 text-center text-zinc-500 font-normal">Tri</th>
              <th className="px-3 py-2 text-center text-zinc-500 font-normal">Bi</th>
              <th className="px-3 py-2 text-center text-zinc-500 font-normal">Uni</th>
              <th className="px-4 py-2 text-right text-zinc-500 font-normal">Tri Freq</th>
              <th className="px-4 py-2 text-right text-zinc-500 font-normal">Bi Freq</th>
              <th className="px-4 py-2 text-right text-zinc-500 font-normal">Uni Freq</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(metadata).map(([word, meta], i) => {
              const [dist, tri, bi, uni, triFreq, biFreq, uniFreq] = meta;
              const isTop = i === 0;
              return (
                <tr key={word} className={`border-b border-zinc-900 ${isTop ? "bg-zinc-900/60" : "hover:bg-zinc-900/30"}`}>
                  <td className="px-4 py-2 text-right font-urdu text-base">
                    {isTop && <span className="mr-2 text-xs text-amber-400">★</span>}
                    <span className={isTop ? "text-zinc-100" : "text-zinc-300"}>{word}</span>
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
