"use client";
import { useState, useEffect, useRef } from "react";
import { api, AlignInfo, LiveModel, TranscribeResult } from "./lib/api";

const uid = () => Math.random().toString(36).slice(2, 8);

interface ManualSlot  { id: string; key: string; text: string; }

interface Props {
  onAligned: (info: AlignInfo) => void;
}

export default function Pass0Speech({ onAligned }: Props) {

  const [audioFile,    setAudioFile]    = useState<File | null>(null);
  const [recording,    setRecording]    = useState(false);
  const [audioBlob,    setAudioBlob]    = useState<Blob | null>(null);
  const [audioURL,     setAudioURL]     = useState<string | null>(null);
  const mediaRef  = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobEvent["data"][]>([]);
  const fileRef   = useRef<HTMLInputElement>(null);

  const [liveModels,   setLiveModels]   = useState<LiveModel[]>([]);
  const [whitelist,    setWhitelist]    = useState<Set<string>>(new Set());
  const [sourceModel,  setSourceModel]  = useState<string>("");
  const [modelsError,  setModelsError]  = useState<string | null>(null);

  const [transcribing, setTranscribing] = useState(false);
  const [transcripts,  setTranscripts]  = useState<Record<string, string> | null>(null);
  const [transError,   setTransError]   = useState<string | null>(null);
  const [manualSlots,  setManualSlots]  = useState<ManualSlot[]>([]);

  const [aligning,     setAligning]     = useState(false);
  const [alignError,   setAlignError]   = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await api.models();
        setLiveModels(data);
        if (data.length) {
          setWhitelist(new Set(data.map(m => m.name)));
          setSourceModel(data[0].name);
        }
      } catch (e: unknown) {
        setModelsError(e instanceof Error ? e.message : "Could not load models");
      }
    };
    fetchModels();
    const interval = setInterval(fetchModels, 10000);
    return () => clearInterval(interval);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr     = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        setAudioFile(null);
        setTranscripts(null);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      setTransError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
  };

  const handleFileUpload = (file: File) => {
    setAudioFile(file);
    setAudioBlob(null);
    setAudioURL(URL.createObjectURL(file));
    setTranscripts(null);
    setTransError(null);
  };

  const clearAudio = () => {
    setAudioFile(null);
    setAudioBlob(null);
    setAudioURL(null);
    setTranscripts(null);
    setTransError(null);
    setManualSlots([]);
  };

  const handleTranscribe = async () => {
    const blob = audioFile ?? audioBlob;
    if (!blob) return;
    if (!whitelist.size) { setTransError("Select at least one model"); return; }
    if (!sourceModel)    { setTransError("Select a source model"); return; }

    setTranscribing(true);
    setTransError(null);
    setTranscripts(null);

    try {
      const result: TranscribeResult = await api.transcribe(
        blob,
        audioFile?.name ?? "recording.webm",
        sourceModel,
        Array.from(whitelist),
      );
      setTranscripts(result.transcripts);
    } catch (e: unknown) {
      setTransError(e instanceof Error ? e.message : "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  const handleAlign = async () => {
    if (!transcripts) return;
    setAligning(true);
    setAlignError(null);

    const ensemble: Record<string, string> = { ...transcripts };
    for (const slot of manualSlots) {
      if (slot.key.trim() && slot.text.trim()) {
        ensemble[slot.key.trim()] = slot.text.trim();
      }
    }

    try {
      const result = await api.align({ ensemble, source_model: sourceModel });
      onAligned(result);
    } catch (e: unknown) {
      setAlignError(e instanceof Error ? e.message : "Alignment failed");
    } finally {
      setAligning(false);
    }
  };

  const addSlot    = () => setManualSlots(p => [...p, { id: uid(), key: "", text: "" }]);
  const removeSlot = (id: string) => setManualSlots(p => p.filter(s => s.id !== id));
  const updateSlot = (id: string, patch: Partial<ManualSlot>) =>
    setManualSlots(p => p.map(s => s.id === id ? { ...s, ...patch } : s));

  const hasAudio = !!(audioFile ?? audioBlob);

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
            <p className="font-mono text-xs text-zinc-600 uppercase tracking-widest mb-2">Drop audio or click to browse</p>
            <p className="font-mono text-sm text-zinc-500">MP3 · WAV · WEBM · M4A</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="font-mono text-xs text-zinc-700 uppercase tracking-widest">or record</span>
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
              <>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                Stop Recording
              </>
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
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Audio</span>
            <span className="font-mono text-sm text-zinc-300 flex-1 truncate">
              {audioFile?.name ?? "recording.webm"}
            </span>
            <button onClick={clearAudio}
              className="px-2 py-1 rounded border border-zinc-800 text-xs font-mono text-zinc-600 hover:border-red-800 hover:text-red-400 transition-colors">
              ✕
            </button>
          </div>
          {audioURL && (
            <audio controls src={audioURL} className="w-full h-8 rounded" />
          )}
        </div>
      )}

      {modelsError ? (
        <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300 font-mono">{modelsError}</p>
      ) : liveModels.length === 0 ? (
        <p className="font-mono text-xs text-zinc-600 uppercase tracking-widest">No models online — start a Kaggle notebook</p>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Live models</p>
            <span className="font-mono text-xs text-zinc-700">{liveModels.length} online</span>
          </div>
          <div className="p-3 space-y-2">
            {liveModels.map(m => {
              const inWhitelist = whitelist.has(m.name);
              const isSrc       = sourceModel === m.name;
              return (
                <div key={m.name}
                  className={`rounded-lg border px-3 py-2.5 flex items-center gap-3 transition-colors ${
                    isSrc ? "border-cyan-800 bg-cyan-950/20" : inWhitelist ? "border-zinc-700 bg-zinc-900" : "border-zinc-800 bg-zinc-950 opacity-50"
                  }`}
                >
                  <button onClick={() => {
                    setWhitelist(p => {
                      const next = new Set(p);
                      if (next.has(m.name)) { next.delete(m.name); if (sourceModel === m.name) setSourceModel(""); }
                      else next.add(m.name);
                      return next;
                    });
                  }}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      inWhitelist ? "border-cyan-700 bg-cyan-900" : "border-zinc-700 bg-zinc-900"
                    }`}
                  >
                    {inWhitelist && <span className="text-cyan-400 text-xs">✓</span>}
                  </button>

                  <span className="font-mono text-sm text-zinc-200 flex-1">{m.name}</span>
                  <span className="font-mono text-xs text-zinc-600">{m.last_ping_ago}s ago</span>

                  <button
                    onClick={() => { setSourceModel(m.name); setWhitelist(p => { const next = new Set(p); next.add(m.name); return next; }); }}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      isSrc ? "bg-cyan-900 text-cyan-300 border border-cyan-700" : "text-zinc-600 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    {isSrc ? "★ SRC" : "SRC"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasAudio && liveModels.length > 0 && !transcripts && (
        <button onClick={handleTranscribe} disabled={transcribing || !whitelist.size}
          className="w-full rounded-lg border border-violet-800 bg-violet-950 py-3 text-sm font-mono font-semibold text-violet-300 uppercase tracking-widest transition-all hover:bg-violet-900 hover:border-violet-600 disabled:opacity-40 disabled:cursor-not-allowed">
          {transcribing ? "Transcribing..." : "Transcribe →"}
        </button>
      )}

      {transError && (
        <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300 font-mono">{transError}</p>
      )}

      {transcripts && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">Transcripts</p>
            <button onClick={handleTranscribe} disabled={transcribing}
              className="px-3 py-1 rounded border border-zinc-700 text-xs font-mono text-zinc-500 hover:border-violet-700 hover:text-violet-400 transition-colors disabled:opacity-40">
              ↺ Re-run
            </button>
          </div>

          <div className="space-y-2">
            {Object.entries(transcripts).map(([model, text]) => {
              const isSrc = model === sourceModel;
              return (
                <div key={model} className={`rounded-xl border p-3 space-y-2 ${isSrc ? "border-cyan-800 bg-cyan-950/20" : "border-zinc-800 bg-zinc-950"}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest flex-1">{model}</span>
                    {isSrc && <span className="font-mono text-xs text-cyan-500">★ source</span>}
                    <span className="font-mono text-xs text-zinc-700 italic">readonly</span>
                  </div>
                  <p dir="rtl" className="w-full font-urdu text-base text-zinc-100 text-right px-1 leading-relaxed">
                    {text}
                  </p>
                </div>
              );
            })}
          </div>

          {manualSlots.map(slot => (
            <div key={slot.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input type="text" value={slot.key} onChange={e => updateSlot(slot.id, { key: e.target.value })}
                  placeholder="model key..."
                  className="w-44 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:border-cyan-700 focus:outline-none" />
                <div className="flex-1" />
                <button onClick={() => removeSlot(slot.id)}
                  className="px-2 py-1 rounded text-xs font-mono text-zinc-700 border border-zinc-800 hover:border-red-800 hover:text-red-400 transition-colors">✕</button>
              </div>
              <textarea dir="rtl" rows={2} value={slot.text} onChange={e => updateSlot(slot.id, { text: e.target.value })}
                placeholder="اردو متن یہاں لکھیں..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-right font-urdu text-base text-zinc-100 placeholder-zinc-700 focus:border-cyan-700 focus:outline-none resize-none" />
            </div>
          ))}

          <button onClick={addSlot}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            + Add comparison transcript
          </button>

          {alignError && (
            <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300 font-mono">{alignError}</p>
          )}

          <button onClick={handleAlign} disabled={aligning}
            className="w-full rounded-lg border border-cyan-800 bg-cyan-950 py-3 text-sm font-mono font-semibold text-cyan-300 uppercase tracking-widest transition-all hover:bg-cyan-900 hover:border-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed">
            {aligning ? "Aligning..." : "Run Alignment →"}
          </button>
        </div>
      )}
    </div>
  );
}