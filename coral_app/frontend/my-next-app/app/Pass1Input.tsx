"use client";
import { useState, useEffect, useRef } from "react";
import { AlignInfo } from "./lib/api";

const STORAGE_KEY = "coral_pass1";
const SKIP_COLS   = ["path"];

const MATCH_STYLE: Record<number, string> = {
  0: "bg-emerald-950 text-emerald-300 border-emerald-800",
  1: "bg-blue-950   text-blue-300   border-blue-800",
  2: "bg-red-950    text-red-300    border-red-800",
  3: "bg-amber-950  text-amber-300  border-amber-800",
};

interface Model { id: string; key: string; text: string; }
interface Row   { path?: string; [k: string]: string | undefined; }
interface Props  { onAligned: (info: AlignInfo) => void; }

const uid = () => Math.random().toString(36).slice(2, 8);

const mkModel = (key = "", text = ""): Model => ({ id: uid(), key, text });

const DEFAULT: Model[] = [
  mkModel("ground_truth"),
  mkModel("seamless_large"),
  mkModel("whisper_large"),
  mkModel("whisper_medium"),
  mkModel("wav2vec_urdu"),
];

function parseFile(content: string, name: string): Row[] {
  const sep     = name.endsWith(".tsv") ? "\t" : ",";
  const lines   = content.split(/\r?\n/).filter(l => l.trim());
  const headers = lines[0].split(sep).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(sep);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() ?? ""]));
  });
}

export default function Pass1Input({ onAligned }: Props) {
  const [models,    setModels]    = useState<Model[]>(DEFAULT);
  const [sourceId,  setSourceId]  = useState(DEFAULT[1].id);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [alignInfo, setAlignInfo] = useState<AlignInfo | null>(null);
  const [rows,      setRows]      = useState<Row[]>([]);
  const [rowIdx,    setRowIdx]    = useState(0);
  const [fileName,  setFileName]  = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (!s) return;
      const p = JSON.parse(s);
      if (p.models)    setModels(p.models);
      if (p.sourceId)  setSourceId(p.sourceId);
      if (p.alignInfo) setAlignInfo(p.alignInfo);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ models, sourceId, alignInfo })); }
    catch {}
  }, [models, sourceId, alignInfo]);

  const add    = ()          => setModels(p => [...p, mkModel()]);
  const remove = (id:string) => setModels(p => {
    const next = p.filter(m => m.id !== id);
    if (sourceId === id && next.length) setSourceId(next[0].id);
    return next;
  });
  const update = (id: string, patch: Partial<Model>) =>
    setModels(p => p.map(m => m.id === id ? { ...m, ...patch } : m));

  const loadRow = (rowList: Row[], idx: number) => {
    const row  = rowList[idx];
    const cols = Object.keys(row).filter(k => !SKIP_COLS.includes(k));
    const next = cols.map(k => mkModel(k, row[k] ?? ""));
    setModels(next);
    setSourceId(next[0]?.id ?? "");
    setAlignInfo(null);
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const parsed = parseFile(e.target?.result as string, file.name);
      if (!parsed.length) { setError("File appears empty"); return; }
      setRows(parsed);
      setRowIdx(0);
      loadRow(parsed, 0);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleSubmit = async () => {
    setError(null);
    const src = models.find(m => m.id === sourceId);
    if (!src)             { setError("Select a source model"); return; }
    if (!src.key.trim())  { setError("Source model key is empty"); return; }
    const ensemble: Record<string, string> = {};
    for (const m of models) {
      if (!m.key.trim())  { setError("A model key is empty"); return; }
      if (!m.text.trim()) { setError(`${m.key} transcript is empty`); return; }
      ensemble[m.key] = m.text.trim();
    }
    setLoading(true);
    try {
      const { api } = await import("./lib/api");
      const result  = await api.align({ ensemble, source_model: src.key.trim() });
      setAlignInfo(result);
      onAligned(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Alignment failed");
    } finally { setLoading(false); }
  };

  const src        = models.find(m => m.id === sourceId);
  const srcWords   = src && alignInfo
    ? (alignInfo[src.key] as { normalized_attempt: string[] })?.normalized_attempt ?? []
    : [];

  return (
    <div className="space-y-6">

      {/* upload */}
      <div
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950 p-5 text-center cursor-pointer hover:border-zinc-500 transition-colors"
      >
        <input ref={fileRef} type="file" accept=".tsv,.csv" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {fileName
          ? <p className="font-mono text-sm text-zinc-300">{fileName} — <span className="text-zinc-500">{rows.length} rows</span></p>
          : <p className="font-mono text-sm text-zinc-500">Drop .tsv / .csv or click to browse</p>
        }
      </div>

      {/* row selector */}
      {rows.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="font-mono text-xs text-zinc-500 uppercase tracking-widest shrink-0">Row</label>
          <select value={rowIdx} onChange={e => { const i = Number(e.target.value); setRowIdx(i); loadRow(rows, i); }}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-cyan-700 focus:outline-none">
            {rows.map((r, i) => <option key={i} value={i}>{i + 1}. {r.path ?? `Row ${i + 1}`}</option>)}
          </select>
        </div>
      )}

      {/* models */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">{models.length} models</p>
        <button onClick={add}
          className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-300 hover:border-zinc-500 transition-colors">
          + Add
        </button>
      </div>

      <div className="space-y-2">
        {models.map(m => {
          const isSrc = m.id === sourceId;
          return (
            <div key={m.id} className={`rounded-xl border p-3 space-y-2 transition-colors ${isSrc ? "border-cyan-800 bg-cyan-950/20" : "border-zinc-800 bg-zinc-950"}`}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={m.key}
                  onChange={e => update(m.id, { key: e.target.value })}
                  placeholder="model key..."
                  className="w-44 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-cyan-700 focus:outline-none"
                />
                <div className="flex-1" />
                <button onClick={() => setSourceId(m.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${isSrc ? "bg-cyan-900 text-cyan-300 border border-cyan-700" : "text-zinc-600 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-400"}`}>
                  {isSrc ? "★ SRC" : "SRC"}
                </button>
                {models.length > 1 && (
                  <button onClick={() => remove(m.id)}
                    className="px-2 py-1 rounded text-xs font-mono text-zinc-700 border border-zinc-800 hover:border-red-800 hover:text-red-400 transition-colors">✕</button>
                )}
              </div>
              <textarea dir="rtl" rows={2} value={m.text} onChange={e => update(m.id, { text: e.target.value })}
                placeholder="اردو متن یہاں لکھیں..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-right font-urdu text-base text-zinc-100 placeholder-zinc-700 focus:border-cyan-700 focus:outline-none resize-none" />
            </div>
          );
        })}
      </div>

      {error && <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300 font-mono">{error}</p>}

      <button onClick={handleSubmit} disabled={loading || !models.length}
        className="w-full rounded-lg border border-cyan-800 bg-cyan-950 py-3 text-sm font-mono font-semibold text-cyan-300 uppercase tracking-widest transition-all hover:bg-cyan-900 hover:border-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed">
        {loading ? "ALIGNING..." : "RUN ALIGNMENT →"}
      </button>

      {/* alignment grid */}
      {alignInfo && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-x-auto">
          <div className="p-3 border-b border-zinc-800 flex gap-4 font-mono text-xs">
            <span className="text-zinc-500 uppercase tracking-widest">Alignment</span>
            <span className="text-emerald-500">MATCH</span>
            <span className="text-amber-500">SUB</span>
            <span className="text-red-500">DEL</span>
            <span className="text-blue-500">INS</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3" dir="rtl">
              <span className="w-32 shrink-0 text-xs font-mono text-cyan-600 text-left truncate" dir="ltr">★ {src?.key}</span>
              <div className="flex flex-wrap gap-1" dir="rtl">
                {srcWords.map((w, i) => (
                  <span key={i} className="px-2 py-1 rounded text-sm font-urdu bg-zinc-800 border border-zinc-700 text-zinc-100">{w}</span>
                ))}
              </div>
            </div>
            {models.filter(m => m.id !== sourceId).map(m => {
              const mdata = alignInfo[m.key] as { attempt_alignment: string[]; attempt_matchinfo: number[] } | undefined;
              if (!mdata) return null;
              return (
                <div key={m.id} className="flex items-center gap-3" dir="rtl">
                  <span className="w-32 shrink-0 text-xs font-mono text-zinc-500 text-left truncate" dir="ltr">{m.key}</span>
                  <div className="flex flex-wrap gap-1" dir="rtl">
                    {mdata.attempt_alignment.map((w, i) => (
                      <span key={i} className={`px-2 py-1 rounded text-sm font-urdu border ${MATCH_STYLE[mdata.attempt_matchinfo[i] ?? 0]}`}>
                        {w || "∅"}
                      </span>
                    ))}
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
