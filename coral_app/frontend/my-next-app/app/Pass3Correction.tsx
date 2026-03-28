"use client";
import { useState, useEffect, useRef } from "react";
import { AlignInfo, OOVResult, CorrectionResult } from "./lib/api";

// ─── Storage ──────────────────────────────────────────────────────────────────
const SK_RESULT = "coral_p3_result";
function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

interface Props {
  alignInfo: AlignInfo;
  oovResult: OOVResult;
}

export default function Pass3Correction({ alignInfo, oovResult }: Props) {
  const [result,  setResult]  = useState<CorrectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const didAutoRun = useRef(false);

  // ── Hydrate ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const r = lsGet<CorrectionResult>(SK_RESULT);
    if (r) setResult(r);
  }, []);

  // ── Auto-run if no cached result ───────────────────────────────────────────
  useEffect(() => {
    if (didAutoRun.current) return;
    didAutoRun.current = true;
    const cached = lsGet<CorrectionResult>(SK_RESULT);
    if (cached) return;
    runCorrection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist ────────────────────────────────────────────────────────────────
  useEffect(() => { lsSet(SK_RESULT, result); }, [result]);

  const runCorrection = async () => {
    setLoading(true);
    setError(null);
    try {
      const { api } = await import("./lib/api");
      const r = await api.correct({ align_info: alignInfo, oov_metadata: oovResult.metadata });
      setResult(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Correction failed");
    } finally {
      setLoading(false);
    }
  };

  const sourceWords    = result?.source.split(" ")    ?? [];
  const correctedWords = result?.corrected.split(" ") ?? [];
  const diffPositions  = new Set(result?.diff.map(d => d.pos) ?? []);
  const changeRate     = result
    ? result.diff.length / (sourceWords.length || 1)
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── Status bar ── */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center gap-4">
        {loading && (
          <span className="flex items-center gap-2 font-mono text-xs text-teal-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Applying corrections...
          </span>
        )}
        {result && !loading && (
          <span className="flex items-center gap-2 font-mono text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Correction complete
          </span>
        )}
        {result && (
          <>
            {result.diff.length === 0 ? (
              <span className="font-mono text-xs text-emerald-500 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                ✓ No changes
              </span>
            ) : (
              <span className="font-mono text-xs text-teal-400 bg-teal-950 border border-teal-800 px-2 py-0.5 rounded tabular-nums">
                {result.diff.length} correction{result.diff.length !== 1 ? "s" : ""}
                &nbsp;·&nbsp;
                {(changeRate * 100).toFixed(0)}% of tokens changed
              </span>
            )}
          </>
        )}
        <div className="flex-1" />
        {result && (
          <button
            onClick={runCorrection}
            disabled={loading}
            className="px-3 py-1 rounded border border-zinc-700 text-xs font-mono text-zinc-500 hover:border-teal-700 hover:text-teal-400 transition-colors disabled:opacity-40"
          >
            ↺ Re-apply
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300 font-mono">{error}</p>
      )}

      {result && (
        <div className="space-y-4">

          {/* ── Side-by-side diff ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="mb-3 text-xs font-mono text-zinc-500 uppercase tracking-widest">Source</p>
              <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
                {sourceWords.map((word, i) => (
                  <span key={i} className={`px-2 py-1 rounded font-urdu text-base border transition-colors ${
                    diffPositions.has(i)
                      ? "border-rose-800 bg-rose-950 text-rose-400 line-through decoration-rose-600"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400"
                  }`}>
                    {word}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-teal-900 bg-zinc-950 p-4">
              <p className="mb-3 text-xs font-mono text-teal-500 uppercase tracking-widest">Corrected</p>
              <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
                {correctedWords.map((word, i) => (
                  <span key={i} className={`px-2 py-1 rounded font-urdu text-base border transition-colors ${
                    diffPositions.has(i)
                      ? "border-teal-600 bg-teal-950 text-teal-200 font-semibold"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400"
                  }`}>
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Change rate mini bar ── */}
          {result.diff.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-xs text-zinc-600">
                <span>token change rate</span>
                <span className="tabular-nums">{(changeRate * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-700"
                  style={{ width: `${changeRate * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Diff table ── */}
          {result.diff.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Changes</p>
                <span className="font-mono text-xs text-zinc-600 tabular-nums">{result.diff.length} edits</span>
              </div>
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-2 text-left text-zinc-600 font-normal w-12">Pos</th>
                    <th className="px-4 py-2 text-right text-zinc-600 font-normal">Original</th>
                    <th className="px-4 py-2 text-center text-zinc-700 font-normal">→</th>
                    <th className="px-4 py-2 text-right text-zinc-600 font-normal">Corrected</th>
                  </tr>
                </thead>
                <tbody>
                  {result.diff.map((d, i) => (
                    <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-2 text-zinc-700 tabular-nums">{d.pos}</td>
                      <td className="px-4 py-2 text-right font-urdu text-base text-rose-400">{d.original}</td>
                      <td className="px-4 py-2 text-center text-zinc-700">→</td>
                      <td className="px-4 py-2 text-right font-urdu text-base text-teal-300 font-semibold">{d.corrected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Final transcript ── */}
          <div className="rounded-xl border border-teal-800 bg-teal-950/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono text-teal-500 uppercase tracking-widest">Final Transcript</p>
              <button
                onClick={() => navigator.clipboard.writeText(result.corrected)}
                className="px-2.5 py-1 rounded border border-zinc-700 text-xs font-mono text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Copy
              </button>
            </div>
            <p dir="rtl" className="font-urdu text-xl leading-loose text-zinc-100 text-right">
              {result.corrected}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
