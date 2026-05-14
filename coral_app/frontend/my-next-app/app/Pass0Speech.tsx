"use client";
import { useState, useEffect, useRef } from "react";
import { api, AlignInfo, LiveModel, TranscribeResult } from "./lib/api";

const uid = () => Math.random().toString(36).slice(2, 8);

interface ManualSlot { id: string; key: string; text: string; }
interface Props { onAligned: (info: AlignInfo) => void; }

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

type Mode = "auto" | "manual";

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
  const [mode,         setMode]         = useState<Mode>("auto");
  const [manualSrc,    setManualSrc]    = useState<string>("");

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

  // Auto-switch to manual mode if no live models came back after first fetch.
  useEffect(() => {
    if (!modelsError && liveModels.length === 0) {
      // give the fetch a moment; if still empty, flip to manual
      const t = setTimeout(() => { if (liveModels.length === 0) setMode("manual"); }, 1500);
      return () => clearTimeout(t);
    }
  }, [liveModels.length, modelsError]);

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
    for (const slot of manualSlots) {
      if (slot.key.trim() && slot.text.trim()) ensemble[slot.key.trim()] = slot.text.trim();
    }
    try {
      onAligned(await api.align({ ensemble, source_model: sourceModel }));
    } catch (e: unknown) {
      setAlignError(e instanceof Error ? e.message : "Alignment failed");
    } finally { setAligning(false); }
  }

  async function handleAlignManual() {
    setAlignError(null);
    const filled = manualSlots
      .map(sl => ({ key: sl.key.trim(), text: sl.text.trim() }))
      .filter(sl => sl.key && sl.text);

    if (filled.length < 2) {
      setAlignError("Need at least 2 transcripts with both a model key and Urdu text");
      return;
    }
    if (new Set(filled.map(f => f.key)).size !== filled.length) {
      setAlignError("Model keys must be unique");
      return;
    }
    const srcKey = manualSrc && filled.find(f => f.key === manualSrc) ? manualSrc : filled[0].key;
    const ensemble: Record<string, string> = {};
    filled.forEach(f => { ensemble[f.key] = f.text; });

    setAligning(true);
    try {
      onAligned(await api.align({ ensemble, source_model: srcKey }));
    } catch (e: unknown) {
      setAlignError(e instanceof Error ? e.message : "Alignment failed");
    } finally { setAligning(false); }
  }

  const addSlot    = () => setManualSlots(p => {
    const next = [...p, { id: uid(), key: "", text: "" }];
    if (!manualSrc && next.length === 1) setManualSrc("");
    return next;
  });
  const removeSlot = (id: string) => setManualSlots(p => p.filter(sl => sl.id !== id));
  const updateSlot = (id: string, patch: Partial<ManualSlot>) =>
    setManualSlots(p => p.map(sl => sl.id === id ? { ...sl, ...patch } : sl));

  // Seed manual mode with 3 starter slots the first time it's opened
  useEffect(() => {
    if (mode === "manual" && manualSlots.length === 0) {
      setManualSlots([
        { id: uid(), key: "whisper-large",  text: "" },
        { id: uid(), key: "seamless-large", text: "" },
        { id: uid(), key: "wav2vec2-urdu",  text: "" },
      ]);
      setManualSrc("whisper-large");
    }
  }, [mode, manualSlots.length]);

  const hasAudio = !!(audio.file ?? audio.blob);

  return (
    <div className="space-y-6">

      {/* ── Audio source ── */}
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

      {/* ── Mode toggle ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-1 flex gap-1">
        {(["auto", "manual"] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 px-4 rounded-lg font-mono text-xs tracking-widest uppercase transition-all ${
              mode === m
                ? "bg-zinc-800 text-zinc-100 shadow-inner"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                mode === m ? (m === "auto" ? "bg-cyan-400" : "bg-violet-400") : "bg-zinc-700"
              }`} />
              {m === "auto" ? "Auto · live ASR" : "Manual transcripts"}
            </span>
          </button>
        ))}
      </div>

      {/* ── AUTO MODE ── */}
      {mode === "auto" && (
        <>
          {modelsError ? <ErrorBanner msg={modelsError} /> : liveModels.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <p className={s.label}>ASR registry empty</p>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                No Kaggle GPU nodes are currently registered with the backend. To use auto-transcription,
                start a Kaggle notebook so it self-registers via ngrok. In the meantime, switch to{" "}
                <button onClick={() => setMode("manual")} className="underline decoration-violet-700 hover:text-violet-300">
                  manual transcripts
                </button>{" "}
                to test the rest of the pipeline.
              </p>
            </div>
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
        </>
      )}

      {/* ── MANUAL MODE ── */}
      {mode === "manual" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-violet-900/60 bg-violet-950/10 px-4 py-3 flex items-start gap-3">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
            <p className="text-sm text-violet-200 leading-relaxed">
              <span className="font-mono text-xs text-violet-400 uppercase tracking-widest">Manual mode</span><br />
              Paste model outputs from any source (Whisper, Seamless, Wav2Vec2, Gemini ASR, etc.).
              Add at least two transcripts with unique model keys, mark one as <b>source</b>, then run alignment.
              Audio is optional in this mode.
            </p>
          </div>

          <div className="space-y-3">
            {manualSlots.map((slot) => {
              const isSrc = manualSrc === slot.key && !!slot.key;
              return (
                <div key={slot.id} className={`rounded-xl border p-3 space-y-2 transition-colors ${isSrc ? "border-cyan-800 bg-cyan-950/20" : "border-zinc-800 bg-zinc-950"}`}>
                  <div className={s.row}>
                    <input
                      type="text"
                      value={slot.key}
                      onChange={e => updateSlot(slot.id, { key: e.target.value })}
                      placeholder="model key (e.g. whisper-large)"
                      className={s.textInput}
                    />
                    <div className="flex-1" />
                    <button
                      onClick={() => slot.key.trim() && setManualSrc(slot.key.trim())}
                      disabled={!slot.key.trim()}
                      className={s.btnSrc(isSrc)}
                    >
                      {isSrc ? "★ SRC" : "SRC"}
                    </button>
                    <button onClick={() => removeSlot(slot.id)} className={s.btnDelete}>✕</button>
                  </div>
                  <textarea
                    dir="rtl"
                    rows={2}
                    value={slot.text}
                    onChange={e => updateSlot(slot.id, { text: e.target.value })}
                    placeholder="اردو متن یہاں لکھیں..."
                    className={s.textarea}
                  />
                </div>
              );
            })}

            <button onClick={addSlot} className={s.btnSm}>+ Add another transcript</button>
          </div>

          <ErrorBanner msg={alignError} />

          <button onClick={handleAlignManual} disabled={aligning} className={s.btnPrimary}>
            {aligning ? "Aligning..." : "Run Alignment →"}
          </button>
        </div>
      )}
    </div>
  );
}
