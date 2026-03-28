
import { useState } from "react";
import { AlignInfo } from "./lib/api";

const MODELS = ["seamless_large", "whisper_large", "whisper_medium", "wav2vec_urdu"];
const MODEL_LABELS: Record<string, string> = {
  seamless_large: "Seamless Large",
  whisper_large:  "Whisper Large",
  whisper_medium: "Whisper Medium",
  wav2vec_urdu:   "Wav2Vec Urdu",
};

const MATCH_STYLES: Record<number, string> = {
  0: "bg-emerald-950 text-emerald-300 border-emerald-800",
  1: "bg-blue-950   text-blue-300   border-blue-800",
  2: "bg-red-950    text-red-300    border-red-800",
  3: "bg-amber-950  text-amber-300  border-amber-800",
};

const MATCH_LABELS: Record<number, string> = {
  0: "M", 1: "I", 2: "D", 3: "S",
};

interface Props {
  onAligned: (info: AlignInfo) => void;
}

export default function Pass1Input({ onAligned }: Props) {
  const [inputs, setInputs]     = useState<Record<string, string>>(Object.fromEntries(MODELS.map(m => [m, ""])));
  const [source, setSource]     = useState("seamless_large");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [alignInfo, setAlignInfo] = useState<AlignInfo | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const { api } = await import("./lib/api");
      const result = await api.align({ ensemble: inputs, source_model: source });
      setAlignInfo(result);
      onAligned(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Alignment failed");
    } finally {
      setLoading(false);
    }
  };

  const sourceWords = alignInfo
    ? (alignInfo[source] as { normalized_attempt: string[] }).normalized_attempt
    : [];

  return (
    <div className="space-y-6">
      {/* inputs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODELS.map(model => (
          <div key={model} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
                {MODEL_LABELS[model]}
              </label>
              <button
                onClick={() => setSource(model)}
                className={`text-xs px-2 py-0.5 rounded font-mono transition-colors ${
                  source === model
                    ? "bg-cyan-900 text-cyan-300 border border-cyan-700"
                    : "text-zinc-600 border border-zinc-800 hover:border-zinc-600"
                }`}
              >
                {source === model ? "SOURCE ✓" : "SET SOURCE"}
              </button>
            </div>
            <textarea
              dir="rtl"
              rows={2}
              value={inputs[model]}
              onChange={e => setInputs(p => ({ ...p, [model]: e.target.value }))}
              placeholder="اردو متن یہاں لکھیں..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-right font-urdu text-base text-zinc-100 placeholder-zinc-700 focus:border-cyan-700 focus:outline-none focus:ring-1 focus:ring-cyan-900 transition-colors resize-none"
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300 font-mono">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full rounded-lg border border-cyan-800 bg-cyan-950 py-3 text-sm font-mono font-semibold text-cyan-300 uppercase tracking-widest transition-all hover:bg-cyan-900 hover:border-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "ALIGNING..." : "RUN ALIGNMENT →"}
      </button>

      {/* alignment grid */}
      {alignInfo && (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="p-4 border-b border-zinc-800">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              Alignment Grid
              <span className="ml-4 text-emerald-500">M=Match</span>
              <span className="ml-3 text-amber-500">S=Sub</span>
              <span className="ml-3 text-red-500">D=Del</span>
              <span className="ml-3 text-blue-500">I=Ins</span>
            </p>
          </div>
          <div className="p-4 space-y-3 overflow-x-auto">
            {/* source row */}
            <div className="flex items-center gap-2" dir="rtl">
              <span className="w-32 shrink-0 text-xs font-mono text-zinc-500 text-left" dir="ltr">
                SOURCE
              </span>
              <div className="flex flex-wrap gap-1" dir="rtl">
                {sourceWords.map((w, i) => (
                  <span key={i} className="px-2 py-1 rounded text-sm font-urdu text-zinc-100 bg-zinc-800 border border-zinc-700">
                    {w}
                  </span>
                ))}
              </div>
            </div>
            {/* model rows */}
            {MODELS.map(model => {
              const mdata = alignInfo[model] as { normalized_attempt: string[]; attempt_matchinfo: number[] };
              if (!mdata) return null;
              return (
                <div key={model} className="flex items-center gap-2" dir="rtl">
                  <span className="w-32 shrink-0 text-xs font-mono text-zinc-500 text-left truncate" dir="ltr">
                    {MODEL_LABELS[model]}
                  </span>
                  <div className="flex flex-wrap gap-1" dir="rtl">
                    {mdata.normalized_attempt.map((w, i) => {
                      const mtype = mdata.attempt_matchinfo[i] ?? 0;
                      return (
                        <span
                          key={i}
                          title={MATCH_LABELS[mtype]}
                          className={`px-2 py-1 rounded text-sm font-urdu border ${MATCH_STYLES[mtype]}`}
                        >
                          {w || "∅"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
