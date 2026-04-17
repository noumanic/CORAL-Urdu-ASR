const HF_TOKEN    = process.env.NEXT_PUBLIC_HF_TOKEN;
const BASE        = process.env.NEXT_PUBLIC_API_URL;
const REGISTRY_BASE = `${process.env.NEXT_PUBLIC_API_URL}/registry`;
const API_SECRET  = process.env.NEXT_PUBLIC_API_SECRET;

export interface AlignRequest {
  ensemble:     Record<string, string>;
  source_model: string;
}

export interface OOVRequest {
  align_info:  AlignInfo;
  freq_cutoff?: number;
  depth?:       number;
  top_n?:       number;
}

export interface CorrectRequest {
  align_info:   AlignInfo;
  oov_metadata: OOVMetadata;
}

export type InfoTag = "MATCH" | "INSERTION" | "DELETION" | "SUBSTITUTION";
export type MetaTag = "SAME" | "SPLIT" | "MERGE" | "NOISE";

const INFO_INT_MAP: Record<number, InfoTag> = {
  0: "MATCH", 1: "INSERTION", 2: "DELETION", 3: "SUBSTITUTION",
};

export function normaliseInfoTags(tags: (InfoTag | number)[]): InfoTag[] {
  return tags.map(t => typeof t === "number" ? (INFO_INT_MAP[t] ?? "MATCH") : t);
}

export interface ModelAlign {
  normalized_attempt:          string[];
  aligned_attempt:             string[];
  aligned_info:                InfoTag[];
  split_merge_aligned_attempt: string[];
  split_merge_metadata:        MetaTag[];
  split_merge_metadata_base:   MetaTag[];
  split_merge_aligned_info:    InfoTag[];
}

export interface AlignInfo {
  source_model: string;
  [model: string]: ModelAlign | string;
}

export type CandidateMeta = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface LiveModel {
  name:          string;
  session_id:    string;
  last_ping_ago: number;
}

export interface TranscribeResult {
  transcripts:  Record<string, string>;
  source_model: string;
  errors:       Record<string, string> | null;
}

export type OOVMetadata = Record<string, Record<string, CandidateMeta>>;

export interface OOVResult {
  oov_dict: string[];
  metadata: OOVMetadata;
  columns:  string[];
}

export interface CorrectionResult {
  source:    string;
  corrected: string;
  diff:      { pos: number; original: string; corrected: string }[];
}

export const api = {
  async align(req: AlignRequest): Promise<AlignInfo> {
    const r = await fetch(`${BASE}/align`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${HF_TOKEN}` },
      body:    JSON.stringify(req),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async oov(req: OOVRequest): Promise<OOVResult> {
    const r = await fetch(`${BASE}/oov`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${HF_TOKEN}` },
      body:    JSON.stringify(req),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async correct(req: CorrectRequest): Promise<CorrectionResult> {
    const r = await fetch(`${BASE}/correct`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${HF_TOKEN}` },
      body:    JSON.stringify(req),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async models(): Promise<LiveModel[]> {
    const r = await fetch(`${REGISTRY_BASE}/models`, {
      headers: { "Authorization": `Bearer ${HF_TOKEN}` },
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async transcribe(
    audio: Blob,
    filename: string,
    source_model: string,
    whitelist: string[],
  ): Promise<TranscribeResult> {
    const formData = new FormData();
    formData.append("audio", audio, filename);
    formData.append("source_model", source_model);
    formData.append("whitelist", whitelist.join(","));
    const r = await fetch(`${REGISTRY_BASE}/transcribe`, {
      method:  "POST",
      headers: { "Authorization": `Bearer ${HF_TOKEN}`, "X-Api-Token": API_SECRET ?? "" },
      body:    formData,
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};