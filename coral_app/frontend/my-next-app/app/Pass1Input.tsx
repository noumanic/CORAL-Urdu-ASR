"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { AlignInfo } from "./lib/api";

// ─── Storage ──────────────────────────────────────────────────────────────────
const SK = {
  models:           "coral_p1_models",
  sourceId:         "coral_p1_sourceId",
  alignInfo:        "coral_p1_alignInfo",
  mapping:          "coral_p1_mapping",
  mappingConfirmed: "coral_p1_mappingConfirmed",
  rows:             "coral_p1_rows",
  rowIdx:           "coral_p1_rowIdx",
  fileName:         "coral_p1_fileName",
};

function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Model    { id: string; key: string; text: string; }
interface RawRow   { [col: string]: string; }
type     ColRole = "label" | "model" | "exclude";
interface ColMapping { col: string; role: ColRole; modelKey: string; }
interface Props { onAligned: (info: AlignInfo) => void; existingAlignInfo: AlignInfo | null; }

const MATCH_STYLE: Record<number, string> = {
  0: "bg-emerald-950 text-emerald-300 border-emerald-800",
  1: "bg-blue-950   text-blue-300   border-blue-800",
  2: "bg-red-950    text-red-300    border-red-800",
  3: "bg-amber-950  text-amber-300  border-amber-800",
};

// match-type label for tooltip
const MATCH_LABEL: Record<number, string> = { 0:"match", 1:"ins", 2:"del", 3:"sub" };

const uid      = () => Math.random().toString(36).slice(2, 8);
const mkModel  = (key = "", text = ""): Model => ({ id: uid(), key, text });

// ─── Delimiter sniff ──────────────────────────────────────────────────────────
function sniffDelimiter(firstLine: string): string {
  const candidates = ["\t", ",", ";", "|"];
  let best = ",", bestCount = 0;
  for (const sep of candidates) {
    const count = firstLine.split(sep).length - 1;
    if (count > bestCount) { bestCount = count; best = sep; }
  }
  return best;
}
const DELIM_LABEL: Record<string, string> = {
  "\t": "Tab", ",": "Comma", ";": "Semicolon", "|": "Pipe",
};

// ─── Parsers ──────────────────────────────────────────────────────────────────
function parseDSV(content: string, delim: string): { headers: string[]; rows: RawRow[] } {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(delim).map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const vals = line.split(delim);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() ?? ""]));
  });
  return { headers, rows };
}

function parseJSON(content: string): { headers: string[]; rows: RawRow[] } {
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed) && parsed.length && typeof parsed[0] === "object") {
    const headers = Object.keys(parsed[0]);
    return { headers, rows: parsed.map((r: Record<string, unknown>) =>
      Object.fromEntries(headers.map(h => [h, String(r[h] ?? "")]))) };
  }
  if (typeof parsed === "object" && !Array.isArray(parsed)) {
    const headers = Object.keys(parsed);
    const len = (parsed[headers[0]] as unknown[]).length;
    return { headers, rows: Array.from({ length: len }, (_, i) =>
      Object.fromEntries(headers.map(h => [h, String((parsed[h] as unknown[])[i] ?? "")]))) };
  }
  throw new Error("JSON must be array of objects or object of arrays");
}



// ─── Component ────────────────────────────────────────────────────────────────
export default function Pass1Input({ onAligned, existingAlignInfo }: Props) {
  const [fileName,          setFileName]          = useState("");
  const [headers,           setHeaders]           = useState<string[]>([]);
  const [rows,              setRows]              = useState<RawRow[]>([]);
  const [delim,             setDelim]             = useState(",");
  const [rawContent,        setRawContent]        = useState<string | null>(null);
  const [isJson,            setIsJson]            = useState(false);
  const [mapping,           setMapping]           = useState<ColMapping[] | null>(null);
  const [mappingConfirmed,  setMappingConfirmed]  = useState(false);
  const [models,            setModels]            = useState<Model[]>([]);
  const [sourceId,          setSourceId]          = useState("");
  const [rowIdx,            setRowIdx]            = useState(0);
  const [alignInfo,         setAlignInfo]         = useState<AlignInfo | null>(null);
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [dragging,          setDragging]          = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Hydrate — only restore display state, never re-trigger onAligned ────────
  useEffect(() => {
    const m   = lsGet<Model[]>(SK.models);
    const si  = lsGet<string>(SK.sourceId);
    const ai  = lsGet<AlignInfo>(SK.alignInfo);
    const mp  = lsGet<ColMapping[]>(SK.mapping);
    const mc  = lsGet<boolean>(SK.mappingConfirmed);
    const rs  = lsGet<RawRow[]>(SK.rows);
    const ri  = lsGet<number>(SK.rowIdx);
    const fn  = lsGet<string>(SK.fileName);

    if (m)  setModels(m);
    if (si) setSourceId(si);
    if (ai) setAlignInfo(ai); // just restore display — page.tsx already has this
    if (mp) setMapping(mp);
    if (mc) setMappingConfirmed(mc);
    if (rs) setRows(rs);
    if (ri !== null) setRowIdx(ri);
    if (fn) setFileName(fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist ───────────────────────────────────────────────────────────────
  useEffect(() => { lsSet(SK.models,           models);           }, [models]);
  useEffect(() => { lsSet(SK.sourceId,         sourceId);         }, [sourceId]);
  useEffect(() => { lsSet(SK.alignInfo,        alignInfo);        }, [alignInfo]);
  useEffect(() => { lsSet(SK.mapping,          mapping);          }, [mapping]);
  useEffect(() => { lsSet(SK.mappingConfirmed, mappingConfirmed); }, [mappingConfirmed]);
  useEffect(() => { lsSet(SK.rows,             rows);             }, [rows]);
  useEffect(() => { lsSet(SK.rowIdx,           rowIdx);           }, [rowIdx]);
  useEffect(() => { lsSet(SK.fileName,         fileName);         }, [fileName]);

  // ── Re-parse on delimiter change ──────────────────────────────────────────
  useEffect(() => {
    if (!rawContent || isJson) return;
    const { headers: h, rows: r } = parseDSV(rawContent, delim);
    setHeaders(h);
    setRows(r);
    setMapping(buildDefaultMapping(h));
    setMappingConfirmed(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delim]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const buildDefaultMapping = (cols: string[]): ColMapping[] =>
    cols.map(col => ({ col, role: "exclude" as ColRole, modelKey: col }));

  const loadRowIntoModels = useCallback((rowList: RawRow[], idx: number, mp: ColMapping[]) => {
    const row       = rowList[idx];
    const modelCols = mp.filter(c => c.role === "model");
    const next      = modelCols.map(c => mkModel(c.modelKey || c.col, row[c.col] ?? ""));
    setModels(next);
    setSourceId(next[0]?.id ?? "");
    setAlignInfo(null);
  }, []);

  // ── File ingestion ────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    setError(null);
    setMappingConfirmed(false);
    setMapping(null);
    setAlignInfo(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      const lower   = file.name.toLowerCase();
      try {
        if (lower.endsWith(".json")) {
          setIsJson(true); setRawContent(null);
          const { headers: h, rows: r } = parseJSON(content);
          if (!r.length) { setError("JSON appears empty"); return; }
          setHeaders(h); setRows(r); setMapping(buildDefaultMapping(h));
        } else {
          setIsJson(false);
          setRawContent(content);
          const firstLine = content.split(/\r?\n/)[0] ?? "";
          const detected  = sniffDelimiter(firstLine);
          setDelim(detected);
          const { headers: h, rows: r } = parseDSV(content, detected);
          if (!r.length) { setError("File appears empty"); return; }
          setHeaders(h); setRows(r); setMapping(buildDefaultMapping(h));
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Parse error");
      }
    };
    reader.readAsText(file, "utf-8");
  };

  // ── Column mapping ────────────────────────────────────────────────────────
  const setColRole     = (col: string, role: ColRole) =>
    setMapping(p => p ? p.map(c => c.col === col ? { ...c, role } : c) : p);
  const setColModelKey = (col: string, key: string) =>
    setMapping(p => p ? p.map(c => c.col === col ? { ...c, modelKey: key } : c) : p);

  const confirmMapping = () => {
    if (!mapping || !rows.length) return;
    if (!mapping.some(c => c.role === "model")) { setError("Assign at least one column as a model"); return; }
    setMappingConfirmed(true);
    loadRowIntoModels(rows, rowIdx, mapping);
  };

  // ── Model slot ops ────────────────────────────────────────────────────────
  const add    = ()           => setModels(p => [...p, mkModel()]);
  const remove = (id: string) => setModels(p => {
    const next = p.filter(m => m.id !== id);
    if (sourceId === id && next.length) setSourceId(next[0].id);
    return next;
  });
  const update = (id: string, patch: Partial<Model>) =>
    setModels(p => p.map(m => m.id === id ? { ...m, ...patch } : m));

  const handleRowChange = (idx: number) => {
    setRowIdx(idx);
    if (mapping) loadRowIntoModels(rows, idx, mapping);
    setAlignInfo(null);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null);
    const src = models.find(m => m.id === sourceId);
    if (!src)            { setError("Select a source model"); return; }
    if (!src.key.trim()) { setError("Source model key is empty"); return; }
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
      onAligned(result); // this triggers page navigation — only called here, never on hydration
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Alignment failed");
    } finally { setLoading(false); }
  };

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onDragStart = (col: string) => setDragging(col);
  const onDragOver  = (e: React.DragEvent) => e.preventDefault();
  const onDropZone  = (role: ColRole) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragging) { setColRole(dragging, role); setDragging(null); }
  };

  const labelCol = mapping?.find(c => c.role === "label")?.col ?? null;

  return (
    <div className="space-y-6">

      {/* ── Upload zone — compact when file already loaded ── */}
      {!fileName ? (
        <div
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950 p-8 text-center cursor-pointer hover:border-zinc-500 transition-colors group"
        >
          <input ref={fileRef} type="file" accept=".tsv,.csv,.json" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <p className="font-mono text-xs text-zinc-600 uppercase tracking-widest mb-2">Drop file or click to browse</p>
          <p className="font-mono text-sm text-zinc-500">.csv &nbsp;·&nbsp; .tsv &nbsp;·&nbsp; .json</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center gap-3">
          <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">File</span>
          <span className="font-mono text-sm text-zinc-300 flex-1 truncate">{fileName}</span>
          <span className="font-mono text-xs text-zinc-600">{rows.length} rows</span>
          {mappingConfirmed && (
            <button
              onClick={() => setMappingConfirmed(false)}
              className="px-2.5 py-1 rounded border border-zinc-700 text-xs font-mono text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ↩ Re-map
            </button>
          )}
          <button
            onClick={() => {
              setFileName(""); setHeaders([]); setRows([]); setMapping(null);
              setMappingConfirmed(false); setAlignInfo(null); setRawContent(null);
            }}
            className="px-2 py-1 rounded border border-zinc-800 text-xs font-mono text-zinc-600 hover:border-red-800 hover:text-red-400 transition-colors"
          >
            ✕
          </button>
          <input ref={fileRef} type="file" accept=".tsv,.csv,.json" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      )}

      {/* ── Delimiter picker — only before mapping confirmed ── */}
      {fileName && !isJson && !mappingConfirmed && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-600 uppercase tracking-widest shrink-0">Delimiter</span>
          <div className="flex gap-1">
            {["\t", ",", ";", "|"].map(d => (
              <button key={d} onClick={() => setDelim(d)}
                className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${
                  delim === d
                    ? "border-cyan-700 bg-cyan-950 text-cyan-300"
                    : "border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                }`}
              >
                {DELIM_LABEL[d]}
              </button>
            ))}
          </div>
          <span className="font-mono text-xs text-zinc-700 ml-1">auto-detected</span>
        </div>
      )}

      {/* ── Column mapper ── */}
      {mapping && !mappingConfirmed && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-950 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">Map columns</p>
            <span className="font-mono text-xs text-zinc-700">{headers.length} columns · drag to assign</span>
          </div>

          {/* 3-row preview */}
          <div className="overflow-x-auto border-b border-zinc-800">
            <table className="text-xs font-mono min-w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {headers.map(h => (
                    <th key={h} className="px-3 py-2 text-left text-zinc-500 font-normal whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-b border-zinc-900">
                    {headers.map(h => (
                      <td key={h} className="px-3 py-1.5 text-zinc-500 max-w-[200px] truncate font-urdu text-right" dir="rtl">
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* drag zones */}
          <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["label", "model", "exclude"] as ColRole[]).map(role => {
              const zone = mapping.filter(c => c.role === role);
              const meta: Record<ColRole, { label: string; hint: string; border: string; chip: string }> = {
                label:   { label: "Row Label", hint: "index / display key", border: "border-cyan-800/50   bg-cyan-950/20",   chip: "border-cyan-700   bg-cyan-900   text-cyan-200"   },
                model:   { label: "Model",     hint: "transcript column",   border: "border-violet-800/50 bg-violet-950/20", chip: "border-violet-700 bg-violet-900 text-violet-200" },
                exclude: { label: "Exclude",   hint: "ignore this column",  border: "border-zinc-700/50   bg-zinc-900/30",   chip: "border-zinc-600   bg-zinc-800   text-zinc-400"   },
              };
              const m = meta[role];
              return (
                <div key={role}
                  onDragOver={onDragOver}
                  onDrop={onDropZone(role)}
                  className={`rounded-lg border-2 border-dashed p-3 min-h-[90px] transition-colors ${m.border}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-xs text-zinc-400 uppercase tracking-widest">{m.label}</p>
                    <p className="font-mono text-xs text-zinc-700">{m.hint}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {zone.map(c => (
                      <div key={c.col} className="flex flex-col gap-1">
                        <div
                          draggable onDragStart={() => onDragStart(c.col)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono cursor-grab active:cursor-grabbing select-none transition-opacity ${m.chip} ${dragging === c.col ? "opacity-30" : ""}`}
                        >
                          <span className="text-zinc-600">⠿</span>
                          {c.col}
                        </div>
                        {role === "model" && (
                          <input type="text" value={c.modelKey}
                            onChange={e => setColModelKey(c.col, e.target.value)}
                            placeholder="key name..."
                            onClick={e => e.stopPropagation()}
                            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-cyan-700 focus:outline-none"
                          />
                        )}
                      </div>
                    ))}
                    {zone.length === 0 && (
                      <p className="text-xs font-mono text-zinc-700 italic mt-1">drop here</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 pb-4">
            <button onClick={confirmMapping}
              className="w-full rounded-lg border border-cyan-800 bg-cyan-950 py-2.5 text-xs font-mono font-semibold text-cyan-300 uppercase tracking-widest hover:bg-cyan-900 hover:border-cyan-600 transition-colors">
              CONFIRM MAPPING →
            </button>
          </div>
        </div>
      )}

      {/* ── Row selector ── */}
      {mappingConfirmed && rows.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="font-mono text-xs text-zinc-600 uppercase tracking-widest shrink-0">Row</label>
          <select value={rowIdx} onChange={e => handleRowChange(Number(e.target.value))}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200 focus:border-cyan-700 focus:outline-none">
            {rows.map((r, i) => (
              <option key={i} value={i}>
                {i + 1}. {labelCol ? (r[labelCol] ?? `Row ${i + 1}`) : `Row ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Model slots ── */}
      {(mappingConfirmed || !fileName) && (
        <>
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-zinc-600 uppercase tracking-widest">{models.length} models</p>
            <button onClick={add}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
              + Add model
            </button>
          </div>

          <div className="space-y-2">
            {models.map(m => {
              const isSrc = m.id === sourceId;
              return (
                <div key={m.id} className={`rounded-xl border p-3 space-y-2 transition-colors ${isSrc ? "border-cyan-800 bg-cyan-950/20" : "border-zinc-800 bg-zinc-950"}`}>
                  <div className="flex items-center gap-2">
                    <input type="text" value={m.key} onChange={e => update(m.id, { key: e.target.value })}
                      placeholder="model key..."
                      className="w-44 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-cyan-700 focus:outline-none" />
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
        </>
      )}

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300 font-mono">{error}</p>
      )}

      {(mappingConfirmed || !fileName) && (
        <button onClick={handleSubmit} disabled={loading || !models.length}
          className="w-full rounded-lg border border-cyan-800 bg-cyan-950 py-3 text-sm font-mono font-semibold text-cyan-300 uppercase tracking-widest transition-all hover:bg-cyan-900 hover:border-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? "ALIGNING..." : "RUN ALIGNMENT →"}
        </button>
      )}
    </div>
  );
}