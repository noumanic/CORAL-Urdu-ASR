const HF_TOKEN = process.env.HF_TOKEN;
const BASE = process.env.API_URL;
const REGISTRY_BASE = `${process.env.API_URL}/registry`;
const API_SECRET    = process.env.API_SECRET;

export interface AlignRequest {
  ensemble: Record<string, string>;
  source_model: string;
}

export interface OOVRequest {
  align_info: AlignInfo;
  freq_cutoff?: number;
  depth?: number;
  top_n?: number;
}

export interface CorrectRequest {
  align_info: AlignInfo;
  oov_metadata: OOVMetadata;
}

export interface ModelAlign {
  normalized_attempt: string[];
  attempt_alignment: string[];
  attempt_matchinfo: number[];
}

export interface AlignInfo {
  source_model: string;
  [model: string]: ModelAlign | string;
}

export type CandidateMeta = [
  number, // dist
  number, // is_in_tri
  number, // is_in_bi
  number, // is_in_uni
  number, // tri_freq
  number, // bi_freq
  number  // uni_freq
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
  columns: string[]
}

export interface CorrectionResult {
  source: string;
  corrected: string;
  diff: { pos: number; original: string; corrected: string }[];
}

export interface ModelAlign {
  normalized_attempt: string[];
  attempt_alignment: string[];
  attempt_matchinfo: number[];
  split_merge_attempt: string[];      // add
  split_merge_matchinfo: number[];    // add
  split_merge?: object;               // add (for animations)
}

export interface SplitMergeRequest {
  align_info: AlignInfo;
}

export const api = {
  async splitMerge(req: SplitMergeRequest): Promise<AlignInfo> {
    const r = await fetch(`${BASE}/split-merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${HF_TOKEN}` },
      body: JSON.stringify(req),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async align(req: AlignRequest): Promise<AlignInfo> {
    const r = await fetch(`${BASE}/align`, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "Authorization" : `Bearer ${HF_TOKEN}`
      },
      body: JSON.stringify(req),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async oov(req: OOVRequest): Promise<OOVResult> {
    const r = await fetch(`${BASE}/oov`, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "Authorization" : `Bearer ${HF_TOKEN}`
      },
      body: JSON.stringify(req),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async correct(req: CorrectRequest): Promise<CorrectionResult> {
    const r = await fetch(`${BASE}/correct`, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "Authorization" : `Bearer ${HF_TOKEN}`
      },
      body: JSON.stringify(req),
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
  async transcribe(audio: Blob, filename: string, source_model: string, whitelist: string[]): Promise<TranscribeResult> {
    const formData = new FormData();
    formData.append("audio", audio, filename);
    formData.append("source_model", source_model);
    formData.append("whitelist", whitelist.join(","));
    const r = await fetch(`${REGISTRY_BASE}/transcribe`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "X-Api-Token":   API_SECRET ?? "",
      },
      body: formData,
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
};
