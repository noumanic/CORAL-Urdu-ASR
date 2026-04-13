"use client";
import { useState, useEffect, useRef } from "react";
import { api, AlignInfo, LiveModel, TranscribeResult } from "./lib/api";

const uid = () => Math.random().toString(36).slice(2, 8);

interface ManualSlot { id: string; key: string; text: string; }
interface Props { onAligned: (info: AlignInfo) => void; }

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  card:       "rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden",
  cardSm:     "rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3",
  row:        "flex items-center gap-3",
  label:      "font-mono text-xs text-zinc-500 uppercase tracking-widest",
  labelDim:   "font-mono text-xs text-zinc-700",
  textInput:  "w-44 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-cyan-700 focus:outline-none",
  textarea:   "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-right font-urdu text-base text-zinc-100 placeholder-zinc-700 focus:border-cyan-700 focus:outline-none resize-none",
  btnPrimary: "w-full rounded-lg border border-cyan-800 bg-cyan-950 py-3 text-sm font-mono font-semibold text-cyan-300 uppercase tracking-widest transition-all hover:bg-cyan-900 hover:border-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed",
  btnViolet:  "w-full rounded-lg border border-violet-800 bg-violet-950 py-3 text-sm font-mono font-semibold text-violet-300 uppercase tracking-widest transition-all hover:bg-violet-900 hover:border-violet-600 disabled:opacity-40 disabled:cursor-not-allowed",
  btnSm:      "px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors",
  btnGhost:   "px-3 py-1 rounded border border-zinc-700 text-xs font-mono text-zinc-500 hover:border-violet-700 hover:text-violet-400 transition-colors disabled:opacity-40",
  btnDelete:  "px-2 py-1 rounded border border-zinc-800 text-xs font-mono text-zinc-600 hover:border-red-800 hover:text-red-400 transition-colors",
  btnSrc:     (on: boolean) => on
    ? "px-2.5 py-1 rounded text-xs font-mono bg-cyan-900 text-cyan-300 border border-cyan-700"
    : "px-2.5 py-1 rounded text-xs font-mono text-zinc-600 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-400 transition-colors",
  btnCheck:   (on: boolean) => `w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${on ? "border-cyan-700 bg-cyan-900" : "border-zinc-700 bg-zinc-900"}`,
  modelRow:   (isSrc: boolean, inList: boolean) => `rounded-lg border px-3 py-2.5 flex items-center gap-3 transition-colors ${isSrc ? "border-cyan-800 bg-cyan-950/20" : inList ? "border-zinc-700 bg-zinc-900" : "border-zinc-800 bg-zinc-950 opacity-50"}`,
  transcript: (isSrc: boolean) => `rounded-xl border p-3 space-y-2 ${isSrc ? "border-cyan-800 bg-cyan-950/20" : "border-zinc-800 bg-zinc-950"}`,
};

function ErrorBanner({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300 font-mono">{msg}</p>;
}

export default function Pass0Speech({ onAligned }: Props) {

  const [audio,        setAudio]        = useState<{ file: File | null; blob: Blob | null; url: string | null }>({ file: null, blob: null, url: null });
  const [recording,    setRecording]    = useState(false);
  const [liveModels,   setLiveModels]   = useState<LiveModel[]>([]);
  const [whitelist,    setWhitelist]    = useState<Set<string>>(new Set());
  const [sourceModel,  setSourceModel]  = useState("");
  const [modelsError,  setModelsError]  = useState<string | null>(null);
  const [transcripts,  setTranscripts]  = useState<Record<string, string> | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transError,   setTransError]   = useState<string | null>(null);
  const [aligning,     setAligning]     = useState(false);
  const [alignError,   setAlignError]   = useState<string | null>(null);
  const [manualSlots,  setManualSlots]  = useState<ManualSlot[]>([]);

  const mediaRef  = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobEvent["data"][]>([]);
  const fileRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        const data = await api.models();
        setLiveModels(data);
        if (data.length) {
          setWhitelist(new Set(data.map((m: LiveModel) => m.name)));
          setSourceModel(data[0].name);
        }
      } catch (e: unknown) {
        setModelsError(e instanceof Error ? e.message : "Could not load models");
      }
    }
    fetchModels();
    const id = setInterval(fetchModels, 40000);
    return () => clearInterval(id);
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudio({ file: null, blob, url: URL.createObjectURL(blob) });
        setTranscripts(null);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch { setTransError("Microphone access denied"); }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
  }

  function handleFileUpload(file: File) {
    setAudio({ file, blob: null, url: URL.createObjectURL(file) });
    setTranscripts(null);
    setTransError(null);
  }

  function clearAudio() {
    setAudio({ file: null, blob: null, url: null });
    setTranscripts(null);
    setTransError(null);
    setManualSlots([]);
  }

  function toggleWhitelist(name: string) {
    setWhitelist(prev => {
      const next = new Set(prev);
      if (next.has(name)) { next.delete(name); if (sourceModel === name) setSourceModel(""); }
      else next.add(name);
      return next;
    });
  }

  async function handleTranscribe() {
    const blob = audio.file ?? audio.blob;
    if (!blob) return;
    if (!whitelist.size) { setTransError("Select at least one model"); return; }
    if (!sourceModel)    { setTransError("Select a source model"); return; }
    setTranscribing(true); setTransError(null); setTranscripts(null);
    try {
      const result: TranscribeResult = await api.transcribe(
        blob, audio.file?.name ?? "recording.webm", sourceModel, Array.from(whitelist),
      );
      setTranscripts(result.transcripts);
    } catch (e: unknown) {
      setTransError(e instanceof Error ? e.message : "Transcription failed");
    } finally { setTranscribing(false); }
  }

  async function handleAlign() {
    if (!transcripts) return;
    setAligning(true); setAlignError(null);
    const ensemble: Record<string, string> = { ...transcripts };
    for (const s of manualSlots) {
      if (s.key.trim() && s.text.trim()) ensemble[s.key.trim()] = s.text.trim();
    }
    try {
      onAligned(await api.align({ ensemble, source_model: sourceModel }));
    } catch (e: unknown) {
      setAlignError(e instanceof Error ? e.message : "Alignment failed");
    } finally { setAligning(false); }
  }

  const addSlot    = () => setManualSlots(p => [...p, { id: uid(), key: "", text: "" }]);
  const removeSlot = (id: string) => setManualSlots(p => p.filter(s => s.id !== id));
  const updateSlot = (id: string, patch: Partial<ManualSlot>) =>
    setManualSlots(p => p.map(s => s.id === id ? { ...s, ...patch } : s));

  const hasAudio = !!(audio.file ?? audio.blob);

  return (
    <div className="space-y-6">

      {!hasAudio ? (
        <div className="space-y-3">
          <div
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950 p-8 text-center cursor-pointer hover:border-zinc-500 transition-colors"
          >
            <input ref={fileRef} type="file" accept="audio/*,.mp3,.wav,.webm,.m4a" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
            <p className={`${s.label} mb-2`}>Drop audio or click to browse</p>
            <p className="font-mono text-sm text-zinc-500">MP3 · WAV · WEBM · M4A</p>
          </div>

          <div className={s.row}>
            <div className="flex-1 h-px bg-zinc-800" />
            <span className={s.labelDim}>or record</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-full rounded-xl border py-4 font-mono text-sm font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
              recording
                ? "border-red-700 bg-red-950 text-red-300 hover:bg-red-900"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-violet-700 hover:bg-violet-950/20 hover:text-violet-300"
            }`}
          >
            {recording ? (
              <><span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />Stop Recording</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
                Start Recording
              </>
            )}
          </button>
        </div>
      ) : (
        <div className={`${s.cardSm} space-y-3`}>
          <div className={s.row}>
            <span className={s.label}>Audio</span>
            <span className="font-mono text-sm text-zinc-300 flex-1 truncate">{audio.file?.name ?? "recording.webm"}</span>
            <button onClick={clearAudio} className={s.btnDelete}>✕</button>
          </div>
          {audio.url && <audio controls src={audio.url} className="w-full h-8 rounded" />}
        </div>
      )}

      {modelsError ? <ErrorBanner msg={modelsError} /> : liveModels.length === 0 ? (
        <p className={s.label}>No models online — start a Kaggle notebook</p>
      ) : (
        <div className={s.card}>
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <p className={s.label}>Live models</p>
            <span className={s.labelDim}>{liveModels.length} online</span>
          </div>
          <div className="p-3 space-y-2">
            {liveModels.map(m => {
              const inList = whitelist.has(m.name);
              const isSrc  = sourceModel === m.name;
              return (
                <div key={m.name} className={s.modelRow(isSrc, inList)}>
                  <button onClick={() => toggleWhitelist(m.name)} className={s.btnCheck(inList)}>
                    {inList && <span className="text-cyan-400 text-xs">✓</span>}
                  </button>
                  <span className="font-mono text-sm text-zinc-200 flex-1">{m.name}</span>
                  <span className={s.labelDim}>{m.last_ping_ago}s ago</span>
                  <button onClick={() => { setSourceModel(m.name); setWhitelist(p => new Set(p).add(m.name)); }}
                    className={s.btnSrc(isSrc)}>
                    {isSrc ? "★ SRC" : "SRC"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasAudio && liveModels.length > 0 && !transcripts && (
        <button onClick={handleTranscribe} disabled={transcribing || !whitelist.size} className={s.btnViolet}>
          {transcribing ? "Transcribing..." : "Transcribe →"}
        </button>
      )}

      <ErrorBanner msg={transError} />

      {transcripts && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className={s.label}>Transcripts</p>
            <button onClick={handleTranscribe} disabled={transcribing} className={s.btnGhost}>↺ Re-run</button>
          </div>

          <div className="space-y-2">
            {Object.entries(transcripts).map(([model, text]) => {
              const isSrc = model === sourceModel;
              return (
                <div key={model} className={s.transcript(isSrc)}>
                  <div className={s.row}>
                    <span className={`${s.label} flex-1`}>{model}</span>
                    {isSrc && <span className="font-mono text-xs text-cyan-500">★ source</span>}
                    <span className={`${s.labelDim} italic`}>readonly</span>
                  </div>
                  <p dir="rtl" className="w-full font-urdu text-base text-zinc-100 text-right px-1 leading-relaxed">{text}</p>
                </div>
              );
            })}
          </div>

          {manualSlots.map(slot => (
            <div key={slot.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
              <div className={s.row}>
                <input type="text" value={slot.key} onChange={e => updateSlot(slot.id, { key: e.target.value })}
                  placeholder="model key..." className={s.textInput} />
                <div className="flex-1" />
                <button onClick={() => removeSlot(slot.id)} className={s.btnDelete}>✕</button>
              </div>
              <textarea dir="rtl" rows={2} value={slot.text} onChange={e => updateSlot(slot.id, { text: e.target.value })}
                placeholder="اردو متن یہاں لکھیں..." className={s.textarea} />
            </div>
          ))}

          <button onClick={addSlot} className={s.btnSm}>+ Add comparison transcript</button>

          <ErrorBanner msg={alignError} />

          <button onClick={handleAlign} disabled={aligning} className={s.btnPrimary}>
            {aligning ? "Aligning..." : "Run Alignment →"}
          </button>
        </div>
      )}
    </div>
  );
}