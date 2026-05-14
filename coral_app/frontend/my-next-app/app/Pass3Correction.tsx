"use client";
import { useState, useEffect, useRef } from "react";
import { AlignInfo, OOVResult, CorrectionResult } from "./lib/api";

const SK_RESULT     = "coral_p3_result";
const SK_LLM_RESULT = "coral_p3_llm_result";

function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

interface LLMResult {
  corrected: string;
  reasoning: string;
  changes: { original: string; corrected: string; reason: string }[];
}

interface Props { alignInfo: AlignInfo; oovResult: OOVResult; }

type CorrectionMode = "voting" | "llm";

const s = {
  label:     "text-xs font-mono text-zinc-500 uppercase tracking-widest",
  labelTeal: "text-xs font-mono text-teal-500 uppercase tracking-widest",
  labelDim:  "font-mono text-xs text-zinc-600 tabular-nums",
  btnGhost:  "px-3 py-1 rounded border border-zinc-700 text-xs font-mono text-zinc-500 hover:border-teal-700 hover:text-teal-400 transition-colors disabled:opacity-40",
  btnCopy:   "px-2.5 py-1 rounded border border-zinc-700 text-xs font-mono text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors",
  card:      "rounded-xl border border-zinc-800 bg-zinc-950 p-4",
  wordChip: (changed: boolean, variant: "source" | "corrected" | "violet") => {
    const base    = "px-2 py-1 rounded font-urdu text-base border transition-colors";
    const neutral = "border-zinc-800 bg-zinc-900 text-zinc-400";
    if (!changed) return `${base} ${neutral}`;
    if (variant === "source")  return `${base} border-rose-800   bg-rose-950   text-rose-400   line-through decoration-rose-600`;
    if (variant === "violet")  return `${base} border-violet-600 bg-violet-950 text-violet-200 font-semibold`;
    return                            `${base} border-teal-600   bg-teal-950   text-teal-200   font-semibold`;
  },
};

function ErrorBanner({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm text-red-300 font-mono">{msg}</p>;
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5 items-center h-3">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1 h-1 rounded-full bg-violet-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }} />
      ))}
    </span>
  );
}

// Strip <think>...</think> reasoning blocks and ```json fences, then locate the outermost JSON object.
function parseJsonResponse(raw: string): LLMResult {
  let body = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  body = body.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const start = body.indexOf("{");
  const end   = body.lastIndexOf("}");
  if (start === -1 || end === -1)
    throw new Error(`No JSON object in response. Preview: ${body.slice(0, 160)}`);
  return JSON.parse(body.slice(start, end + 1));
}

const MODEL_CONFIDENCE: Record<string, number> = {
  "seamless-large": 0.90,
  "whisper-large":  0.75,
  "whisper-medium": 0.70,
  "wav2vec2-urdu":  0.60,
};

function getModelConfidence(modelKey: string): number {
  const lower = modelKey.toLowerCase();
  for (const [known, score] of Object.entries(MODEL_CONFIDENCE)) {
    if (lower.includes(known.toLowerCase()) || known.toLowerCase().includes(lower)) {
      return score;
    }
  }
  return 0.65;
}

const URDU_ASR_SYSTEM_PROMPT = `You are a senior Urdu computational linguist and ASR post-correction specialist with deep expertise in:
- Standard Urdu (Khari Boli) grammar, morphology, and orthography
- Nastaliq script conventions and Unicode normalization
- Pakistani and Indian dialectal variation in spoken Urdu
- Common ASR error patterns in Urdu (phoneme confusions, segmentation errors, OOV substitutions)

Your task is to produce the single most linguistically accurate Urdu transcript from multiple noisy ASR hypotheses.

## Correction Mandate — go BEYOND simple word substitution:

1. **Grammatical Agreement**: Fix gender (مذکر/مؤنث), number (واحد/جمع), and case agreement between nouns, adjectives, and verbs. A verb must agree with its subject/object in gender and number.

2. **Izafat Constructions**: Correct کا/کی/کے according to the gender and number of the head noun they modify.

3. **Verb Conjugation**: Repair tense, aspect, and mood errors. ASR frequently confuses similar-sounding verb forms (e.g. آیا/آئی/آئے, کرتا/کرتی/کرتے).

4. **Missing Function Words**: ASR often drops short postpositions (نے، کو، سے، میں، پر، تک). Restore them if surrounding context demands them.

5. **Dialectal Normalisation**: Convert dialectal or colloquial pronunciations to standard written Urdu where appropriate (e.g. ہووے → ہو، کریگا → کرے گا).

6. **Phoneme Confusion Repair**: Urdu ASR frequently confuses: ق/ک, ز/ذ/ض/ظ, ث/س/ص, ح/ہ, ع/ا, غ/گ. Resolve using lexical context.

7. **Segmentation Errors**: ASR may incorrectly split compound words or merge separate words. Fix word boundaries.

8. **OOV Candidates Are Hints, Not Mandates**: If an OOV candidate is linguistically incorrect given the surrounding context, reject it and apply your own judgement.

9. **Confidence-Weighted Arbitration**: When models disagree, weight their votes by the provided confidence scores. Do not treat all models equally — a seamless-large output outweighs three wav2vec2 outputs.

10. **Context Window Reasoning**: Never correct a word in isolation. Read the full sentence before deciding — a word that looks wrong in isolation may be correct given what follows.

## Output Rules:
- Respond ONLY with valid JSON. Zero markdown, zero preamble, zero text outside the JSON object.
- The "corrected" field must be in Urdu script only.
- The "reasoning" field: 2–3 sentences describing what errors dominated this transcript, what strategy you applied, and why.
- The "changes" array: only words that were actually modified. If a change affects a multi-word span, list each token as a separate entry.
- If no corrections are warranted, return the source text verbatim and an empty changes array.`;

function buildPrompt(alignInfo: AlignInfo, oovResult: OOVResult): string {
  const sourceModel = alignInfo.source_model as string;
  const sourceAlign = alignInfo[sourceModel] as {
    normalized_attempt?: string[];
    raw_attempt?: string[];
  };

  const sourceNormalized = sourceAlign?.normalized_attempt?.join(" ") ?? "";
  const sourceRaw        = sourceAlign?.raw_attempt?.join(" ") ?? "";
  const sourceConf       = getModelConfidence(sourceModel);

  const modelBlocks: string[] = [];
  Object.entries(alignInfo).forEach(([key, val]) => {
    if (key === "source_model") return;
    const m = val as { aligned_attempt?: string[]; normalized_attempt?: string[] };
    const text = m?.aligned_attempt?.join(" ") ?? m?.normalized_attempt?.join(" ") ?? "";
    if (!text) return;
    const conf = getModelConfidence(key);
    modelBlocks.push(`[${key}] (confidence: ${conf.toFixed(2)}): ${text}`);
  });

  function extractScore(meta: unknown): number {
    if (typeof meta === "number") return meta;
    if (meta && typeof meta === "object") {
      for (const key of ["score", "confidence", "prob", "probability", "value"]) {
        const v = (meta as Record<string, unknown>)[key];
        if (typeof v === "number") return v;
      }
    }
    return 0;
  }

  const oovSummary = Object.entries(oovResult.metadata).map(([word, candidates]) => {
    const candidateList = Object.entries(candidates as unknown as Record<string, unknown>)
      .map(([c, meta]) => [c, extractScore(meta)] as [string, number])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([c, score]) => `"${c}" (score: ${score.toFixed(3)})`)
      .join(", ");
    return candidateList
      ? `  • "${word}" → candidates: ${candidateList}`
      : `  • "${word}" → no candidates found`;
  }).join("\n");

  return `## SOURCE TRANSCRIPT
Model: ${sourceModel} (confidence: ${sourceConf.toFixed(2)})
Normalised: ${sourceNormalized}${sourceRaw && sourceRaw !== sourceNormalized ? `\nRaw ASR output:  ${sourceRaw}` : ""}

## ALL MODEL HYPOTHESES (weighted by confidence)
${modelBlocks.join("\n") || "(no additional model outputs available)"}

## CONFIDENCE REFERENCE TABLE
seamless-large : 0.90 — highest priority; best Urdu acoustic model, lowest WER
whisper-large  : 0.75 — strong but occasionally drops short function words (نے، کو، سے)
whisper-medium : 0.70 — prone to verb form errors and dialectal substitutions
wav2vec2-urdu  : 0.60 — lowest priority; frequent phoneme confusions and segmentation errors

Arbitration rule: when 2+ high-confidence models (≥0.75) agree on a token, strongly prefer that token.
When all models disagree, apply linguistic knowledge rather than defaulting to the source model.

## OOV WORDS DETECTED
${oovSummary || "  (none detected)"}

## YOUR TASK
Produce the single best corrected Urdu transcript. Apply ALL correction types from your system instructions — grammatical agreement, verb conjugation, izafat, missing postpositions, phoneme confusions, segmentation — not just OOV substitutions. Reason over the full sentence before making any change.

Respond ONLY with this exact JSON (no markdown fences, no text before or after):
{
  "corrected": "<final corrected Urdu transcript>",
  "reasoning": "<2-3 sentences: dominant error types found, strategy applied, key decisions made>",
  "changes": [
    { "original": "<original token>", "corrected": "<corrected token>", "reason": "<specific linguistic justification>" }
  ]
}`;
}

interface AkiResponse {
  text?:    string;
  success?: boolean;
  job_id?:  string;
  total_duration?: number;
}

async function callGptOssChat(userPrompt: string): Promise<string> {
  const url = process.env.NEXT_PUBLIC_AKI_URL;
  const key = process.env.NEXT_PUBLIC_AKI_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_AKI_URL not set in .env");
  if (!key) throw new Error("NEXT_PUBLIC_AKI_KEY not set in .env");

  const fullPrompt = `${URDU_ASR_SYSTEM_PROMPT}\n\n${userPrompt}`;
  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ key, prompt_input: fullPrompt, wait_for_result: true }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`gpt_oss_chat ${res.status}${errText ? `: ${errText}` : ""}`);
  }
  const data: AkiResponse = await res.json();
  if (data.success === false) throw new Error("gpt_oss_chat returned success=false");
  const text = data.text;
  if (!text) throw new Error("Empty response from gpt_oss_chat");
  return text;
}

export default function Pass3Correction({ alignInfo, oovResult }: Props) {
  const [mode,      setMode]      = useState<CorrectionMode>("voting");
  const [result,    setResult]    = useState<CorrectionResult | null>(null);
  const [llmResult, setLlmResult] = useState<LLMResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [llmPhase,  setLlmPhase]  = useState<"idle"|"prompting"|"waiting"|"parsing"|"done">("idle");

  const didAutoRun = useRef(false);

  useEffect(() => {
    const r  = lsGet<CorrectionResult>(SK_RESULT);
    const lr = lsGet<LLMResult>(SK_LLM_RESULT);
    if (r)  setResult(r);
    if (lr) setLlmResult(lr);
  }, []);

  useEffect(() => {
    if (didAutoRun.current) return;
    didAutoRun.current = true;
    if (!lsGet<CorrectionResult>(SK_RESULT)) runVoting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { lsSet(SK_RESULT,     result);    }, [result]);
  useEffect(() => { lsSet(SK_LLM_RESULT, llmResult); }, [llmResult]);

  async function runVoting() {
    setLoading(true); setError(null);
    try {
      const { api } = await import("./lib/api");
      setResult(await api.correct({ align_info: alignInfo, oov_metadata: oovResult.metadata }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Correction failed");
    } finally { setLoading(false); }
  }

  async function runLLM() {
    setLoading(true); setError(null); setLlmResult(null);
    try {
      setLlmPhase("prompting");
      const userPrompt = buildPrompt(alignInfo, oovResult);
      setLlmPhase("waiting");
      const raw = await callGptOssChat(userPrompt);
      setLlmPhase("parsing");
      setLlmResult(parseJsonResponse(raw));
      setLlmPhase("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "LLM correction failed");
      setLlmPhase("idle");
    } finally { setLoading(false); }
  }

  function switchMode(m: CorrectionMode) {
    setMode(m); setError(null);
    if (m === "llm"    && !llmResult) runLLM();
    if (m === "voting" && !result)    runVoting();
  }

  const sourceWords    = result?.source.split(" ")    ?? [];
  const correctedWords = result?.corrected.split(" ") ?? [];
  const diffPositions  = new Set(result?.diff.map(d => d.pos) ?? []);
  const changeRate     = result ? result.diff.length / (sourceWords.length || 1) : 0;

  const llmPhaseLabel: Record<typeof llmPhase, string> = {
    idle: "", prompting: "Building prompt...", waiting: "Waiting for response...",
    parsing: "Parsing...", done: "Done",
  };

  return (
    <div className="space-y-5">

      {/* ── Pass toggle ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-1 flex gap-1">
        {(["voting", "llm"] as CorrectionMode[]).map(m => (
          <button key={m} onClick={() => switchMode(m)}
            className={["flex-1 py-2.5 px-4 rounded-lg font-mono text-xs tracking-widest uppercase transition-all duration-200",
              mode === m ? "bg-zinc-800 text-zinc-100 shadow-inner" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40",
            ].join(" ")}
          >
            <span className="flex items-center justify-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${
                mode === m ? (m === "voting" ? "bg-teal-400" : "bg-violet-400") : "bg-zinc-700"
              }`} />
              {m === "voting" ? "Voting Correction" : "LLM Correction"}
            </span>
          </button>
        ))}
      </div>

      {/* ── Status bar ── */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center gap-4 min-h-[46px]">
        {loading && mode === "voting" && (
          <span className="flex items-center gap-2 font-mono text-xs text-teal-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Applying corrections...
          </span>
        )}
        {loading && mode === "llm" && (
          <span className="flex items-center gap-2 font-mono text-xs text-violet-400">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-violet-400" />
            {llmPhaseLabel[llmPhase]}
            <ThinkingDots />
          </span>
        )}
        {!loading && mode === "voting" && result && (
          <>
            <span className="flex items-center gap-2 font-mono text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Correction complete
            </span>
            {result.diff.length === 0
              ? <span className="font-mono text-xs text-emerald-500 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">No changes</span>
              : <span className="font-mono text-xs text-teal-400 bg-teal-950 border border-teal-800 px-2 py-0.5 rounded tabular-nums">
                  {result.diff.length} correction{result.diff.length !== 1 ? "s" : ""} · {(changeRate * 100).toFixed(0)}% tokens changed
                </span>
            }
          </>
        )}
        {!loading && mode === "llm" && llmResult && (
          <>
            <span className="flex items-center gap-2 font-mono text-xs text-violet-400">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              LLM correction complete
            </span>
            {llmResult.changes.length === 0
              ? <span className="font-mono text-xs text-emerald-500 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">No changes</span>
              : <span className="font-mono text-xs px-2 py-0.5 rounded tabular-nums border text-violet-400 bg-violet-950 border-violet-800">
                  {llmResult.changes.length} correction{llmResult.changes.length !== 1 ? "s" : ""}
                </span>
            }
          </>
        )}
        <div className="flex-1" />
        {!loading && mode === "voting" && result    && <button onClick={runVoting} className={s.btnGhost}>↺ Re-apply</button>}
        {!loading && mode === "llm"    && llmResult && (
          <button onClick={runLLM} className="px-3 py-1 rounded border text-xs font-mono transition-colors border-violet-800 text-violet-500 hover:border-violet-600 hover:text-violet-300">↺ Re-ask</button>
        )}
      </div>

      <ErrorBanner msg={error} />

      {/* ══ VOTING OUTPUT ══ */}
      {mode === "voting" && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={s.card}>
              <p className={`${s.label} mb-3`}>Source</p>
              <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
                {sourceWords.map((word, i) => (
                  <span key={i} className={s.wordChip(diffPositions.has(i), "source")}>{word}</span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-teal-900 bg-zinc-950 p-4">
              <p className={`${s.labelTeal} mb-3`}>Corrected</p>
              <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
                {correctedWords.map((word, i) => (
                  <span key={i} className={s.wordChip(diffPositions.has(i), "corrected")}>{word}</span>
                ))}
              </div>
            </div>
          </div>

          {result.diff.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-xs text-zinc-600">
                <span>token change rate</span>
                <span className="tabular-nums">{(changeRate * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-teal-500 transition-all duration-700" style={{ width: `${changeRate * 100}%` }} />
              </div>
            </div>
          )}

          {result.diff.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <p className={s.label}>Changes</p>
                <span className={s.labelDim}>{result.diff.length} edits</span>
              </div>
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-2 text-left   text-zinc-600 font-normal w-12">Pos</th>
                    <th className="px-4 py-2 text-right  text-zinc-600 font-normal">Original</th>
                    <th className="px-4 py-2 text-center text-zinc-700 font-normal">→</th>
                    <th className="px-4 py-2 text-right  text-zinc-600 font-normal">Corrected</th>
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

          <div className="rounded-xl border border-teal-800 bg-teal-950/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className={s.labelTeal}>Final Transcript</p>
              <button onClick={() => navigator.clipboard.writeText(result.corrected)} className={s.btnCopy}>Copy</button>
            </div>
            <p dir="rtl" className="font-urdu text-xl leading-loose text-zinc-100 text-right">{result.corrected}</p>
          </div>
        </div>
      )}

      {/* ══ LLM OUTPUT ══ */}
      {mode === "llm" && llmResult && (
        <div className="space-y-4">
          {llmResult.reasoning && (
            <div className="rounded-xl px-4 py-3 flex gap-3 border border-violet-900/40 bg-violet-950/10">
              <span className="text-xs font-mono uppercase tracking-widest shrink-0 pt-0.5 text-violet-500">
                reasoning
              </span>
              <p className="font-mono text-xs leading-relaxed text-violet-300">
                {llmResult.reasoning}
              </p>
            </div>
          )}

          {(() => {
            const sm      = alignInfo.source_model as string;
            const sa      = alignInfo[sm] as { normalized_attempt?: string[] };
            const srcTok  = sa?.normalized_attempt ?? [];
            const changedOrig = new Set(llmResult.changes.map(c => c.original));
            const changedCorr = new Set(llmResult.changes.map(c => c.corrected));
            const corrTok     = llmResult.corrected.split(" ");
            return (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className={s.card}>
                  <p className={`${s.label} mb-3`}>Source</p>
                  <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
                    {srcTok.map((word, i) => (
                      <span key={i} className={s.wordChip(changedOrig.has(word), "source")}>{word}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-violet-900 bg-zinc-950 p-4">
                  <p className="text-xs font-mono uppercase tracking-widest mb-3 text-violet-500">
                    LLM Corrected
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
                    {corrTok.map((word, i) => (
                      <span key={i} className={s.wordChip(changedCorr.has(word), "violet")}>{word}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {llmResult.changes.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <p className={s.label}>LLM Changes</p>
                <span className={s.labelDim}>{llmResult.changes.length} edits</span>
              </div>
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-2 text-right  text-zinc-600 font-normal">Original</th>
                    <th className="px-4 py-2 text-center text-zinc-700 font-normal">→</th>
                    <th className="px-4 py-2 text-right  text-zinc-600 font-normal">Corrected</th>
                    <th className="px-4 py-2 text-left   text-zinc-600 font-normal">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {llmResult.changes.map((c, i) => (
                    <tr key={i} className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-2 text-right font-urdu text-base text-rose-400">{c.original}</td>
                      <td className="px-4 py-2 text-center text-zinc-700">→</td>
                      <td className="px-4 py-2 text-right font-urdu text-base font-semibold text-violet-300">{c.corrected}</td>
                      <td className="px-4 py-2 text-left  text-zinc-500 text-xs">{c.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-xl border p-5 border-violet-800 bg-violet-950/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono uppercase tracking-widest text-violet-500">
                Final Transcript · LLM
              </p>
              <button onClick={() => navigator.clipboard.writeText(llmResult.corrected)} className={s.btnCopy}>Copy</button>
            </div>
            <p dir="rtl" className="font-urdu text-xl leading-loose text-zinc-100 text-right">{llmResult.corrected}</p>
          </div>
        </div>
      )}

      {/* LLM loading skeleton */}
      {mode === "llm" && loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-10 rounded-xl bg-zinc-900 border border-zinc-800" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 rounded-xl bg-zinc-900 border border-zinc-800" />
            <div className="h-32 rounded-xl bg-zinc-900 border border-violet-900/30" />
          </div>
          <div className="h-24 rounded-xl bg-zinc-900 border border-zinc-800" />
        </div>
      )}

    </div>
  );
}
