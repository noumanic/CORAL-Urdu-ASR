const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

export type OOVMetadata = Record<string, Record<string, CandidateMeta>>;

export interface OOVResult {
  oov_dict: string[];
  metadata: OOVMetadata;
}

export interface CorrectionResult {
  source: string;
  corrected: string;
  diff: { pos: number; original: string; corrected: string }[];
}

export const api = {
  async align(req: AlignRequest): Promise<AlignInfo> {
    const r = await fetch(`${BASE}/align`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async oov(req: OOVRequest): Promise<OOVResult> {
    const r = await fetch(`${BASE}/oov`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async correct(req: CorrectRequest): Promise<CorrectionResult> {
    const r = await fetch(`${BASE}/correct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};
