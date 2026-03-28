import { useState } from "react";
import { AlignInfo, OOVResult, CorrectionResult } from "./lib/api";

interface Props {
  alignInfo: AlignInfo;
  oovResult: OOVResult;
}

export default function Pass3Correction({ alignInfo, oovResult }: Props) {
  const [result,  setResult]  = useState<CorrectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleCorrect = async () => {
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

  return (
    <div className="space-y-6">
      <button
        onClick={handleCorrect}
        disabled={loading}
        className="w-full rounded-lg border border-teal-800 bg-teal-950 py-3 text-sm font-mono font-semibold text-teal-300 uppercase tracking-widest transition-all hover:bg-teal-900 hover:border-teal-600 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "CORRECTING..." : "APPLY CORRECTIONS →"}
      </button>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300 font-mono">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-4">
          {/* diff stats */}
          <div className="flex gap-4 font-mono text-xs">
            <span className="text-zinc-500">
              {result.diff.length} correction{result.diff.length !== 1 ? "s" : ""} applied
            </span>
            {result.diff.length === 0 && (
              <span className="text-emerald-400">✓ No changes needed</span>
            )}
          </div>

          {/* side by side */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* source */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="mb-3 text-xs font-mono text-zinc-500 uppercase tracking-widest">Source</p>
              <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
                {sourceWords.map((word, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 rounded font-urdu text-base border ${
                      diffPositions.has(i)
                        ? "border-rose-700 bg-rose-950 text-rose-300 line-through"
                        : "border-zinc-800 bg-zinc-900 text-zinc-300"
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* corrected */}
            <div className="rounded-xl border border-teal-900 bg-zinc-950 p-4">
              <p className="mb-3 text-xs font-mono text-teal-500 uppercase tracking-widest">Corrected</p>
              <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
                {correctedWords.map((word, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 rounded font-urdu text-base border ${
                      diffPositions.has(i)
                        ? "border-teal-600 bg-teal-950 text-teal-200 font-semibold"
                        : "border-zinc-800 bg-zinc-900 text-zinc-300"
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* diff table */}
          {result.diff.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Diff</p>
              </div>
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-2 text-left text-zinc-500 font-normal">Pos</th>
                    <th className="px-4 py-2 text-right text-zinc-500 font-normal">Original</th>
                    <th className="px-4 py-2 text-center text-zinc-500 font-normal">→</th>
                    <th className="px-4 py-2 text-right text-zinc-500 font-normal">Corrected</th>
                  </tr>
                </thead>
                <tbody>
                  {result.diff.map((d, i) => (
                    <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/40">
                      <td className="px-4 py-2 text-zinc-600">{d.pos}</td>
                      <td className="px-4 py-2 text-right font-urdu text-base text-rose-300">{d.original}</td>
                      <td className="px-4 py-2 text-center text-zinc-600">→</td>
                      <td className="px-4 py-2 text-right font-urdu text-base text-teal-300 font-semibold">{d.corrected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* final transcript */}
          <div className="rounded-xl border border-teal-800 bg-teal-950/20 p-5">
            <p className="mb-3 text-xs font-mono text-teal-500 uppercase tracking-widest">Final Transcript</p>
            <p dir="rtl" className="font-urdu text-xl leading-loose text-zinc-100 text-right">
              {result.corrected}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
