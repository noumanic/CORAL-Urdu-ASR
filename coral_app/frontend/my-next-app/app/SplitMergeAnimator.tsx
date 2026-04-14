"use client";
import { useEffect, useRef, useState, useCallback } from "react";

interface Candidate {
  type:                    "split" | "merge";
  source_words:            string[];
  model_words:             string[];
  model_word_idx_span:     [number, number];
  source_word_idx_span:    [number, number];
  source_boundaries_in_span: number[];
  model_boundaries_in_span:  number[];
  char_span_start:         number;
  char_span_end:           number;
}

interface Props {
  modelName:       string;
  candidates:      Candidate[];
  chipRefs:        React.MutableRefObject<Map<string, HTMLElement>>;
  containerRef: { current: HTMLDivElement | null };
  onComplete:      (modelName: string, resolvedIdxs: Set<number>) => void;
}

interface FlyingChip {
  id:        string;
  text:      string;
  x:         number;
  y:         number;
  w:         number;
  h:         number;
  targetX:   number;
  targetY:   number;
  targetW:   number;
  phase:     "flying" | "landing";
  type:      "split" | "merge";
  crackAt?:  number; // percentage 0-1 for split crack line
}

const FLY_MS    = 520;
const CRACK_MS  = 280;
const LAND_MS   = 200;

export default function SplitMergeAnimator({ modelName, candidates, chipRefs, containerRef, onComplete }: Props) {
  const [flyingChips,  setFlyingChips]  = useState<FlyingChip[]>([]);
  const [crackChips,   setCrackChips]   = useState<Set<string>>(new Set());
  const [resolvedIdxs, setResolvedIdxs] = useState<Set<number>>(new Set());
  const overlayRef = useRef<HTMLDivElement>(null);
  const hasRun = useRef(false);

  const getRect = useCallback((key: string) => {
    const el  = chipRefs.current.get(key);
    const box = containerRef.current?.getBoundingClientRect();
    if (!el || !box) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height };
  }, [chipRefs, containerRef]);

  useEffect(() => {
    if (hasRun.current || !candidates.length) return;
    hasRun.current = true;

    const allResolved = new Set<number>();
    const chips: FlyingChip[] = [];

    candidates.forEach(c => {
      if (c.type === "split") {
        // one source chip → two target chips
        const srcKey = `${modelName}:${c.model_word_idx_span[0]}`;
        const srcRect = getRect(srcKey);
        if (!srcRect) return;

        // crack percentage from boundary data
        const totalChars = c.model_words[0].length;
        const crackPct   = c.source_boundaries_in_span[0]
          ? c.source_boundaries_in_span[0] / totalChars
          : 0.5;

        c.source_words.forEach((word, wi) => {
          const tgtKey  = `${modelName}:sm:${c.source_word_idx_span[0] + wi}`;
          const tgtRect = getRect(tgtKey);
          if (!tgtRect) return;
          chips.push({
            id:      `${srcKey}-split-${wi}`,
            text:    word,
            x:       srcRect.x,
            y:       srcRect.y,
            w:       srcRect.w,
            h:       srcRect.h,
            targetX: tgtRect.x,
            targetY: tgtRect.y,
            targetW: tgtRect.w,
            phase:   "flying",
            type:    "split",
            crackAt: crackPct,
          });
          allResolved.add(c.source_word_idx_span[0] + wi);
        });

      } else {
        // merge: two source chips → one target chip
        const midX = c.model_word_idx_span[0] +
          Math.floor((c.model_word_idx_span[1] - c.model_word_idx_span[0]) / 2);
        const tgtKey  = `${modelName}:sm:${c.source_word_idx_span[0]}`;
        const tgtRect = getRect(tgtKey);
        if (!tgtRect) return;

        c.model_words.forEach((word, wi) => {
          const srcKey  = `${modelName}:${c.model_word_idx_span[0] + wi}`;
          const srcRect = getRect(srcKey);
          if (!srcRect) return;
          chips.push({
            id:      `${srcKey}-merge-${wi}`,
            text:    word,
            x:       srcRect.x,
            y:       srcRect.y,
            w:       srcRect.w,
            h:       srcRect.h,
            targetX: tgtRect.x,
            targetY: tgtRect.y,
            targetW: tgtRect.w,
            phase:   "flying",
            type:    "merge",
          });
        });
        allResolved.add(c.source_word_idx_span[0]);
      }
    });

    if (!chips.length) { onComplete(modelName, allResolved); return; }

    // phase 1: show crack on split chips
    const splitIds = new Set(chips.filter(c => c.type === "split").map(c => c.id));
    setCrackChips(splitIds);
    setFlyingChips(chips);

    setTimeout(() => {
      // phase 2: fly
      setCrackChips(new Set());
      setFlyingChips(prev => prev.map(c => ({ ...c, phase: "flying" as const })));

      setTimeout(() => {
        // phase 3: land
        setFlyingChips(prev => prev.map(c => ({ ...c, phase: "landing" as const })));

        setTimeout(() => {
          setFlyingChips([]);
          setResolvedIdxs(allResolved);
          onComplete(modelName, allResolved);
        }, LAND_MS);
      }, FLY_MS);
    }, CRACK_MS);

  }, [candidates, modelName, getRect, onComplete]);

  return (
    <div ref={overlayRef} className="absolute inset-0 pointer-events-none z-20">
      {flyingChips.map(chip => {
        const isLanding = chip.phase === "landing";
        const isCracking = crackChips.has(chip.id);
        return (
          <div key={chip.id}
            style={{
              position:   "absolute",
              left:       isLanding ? chip.targetX : chip.x,
              top:        isLanding ? chip.targetY : chip.y,
              width:      isLanding ? chip.targetW : chip.w,
              height:     chip.h,
              transition: isLanding
                ? `left ${FLY_MS}ms cubic-bezier(0.4,0,0.2,1), top ${FLY_MS}ms cubic-bezier(0.4,0,0.2,1), width ${FLY_MS}ms ease`
                : "none",
              zIndex: 30,
            }}
            className={`flex items-center justify-center font-urdu text-sm rounded border overflow-hidden
              ${chip.type === "split"
                ? "border-orange-500 bg-orange-950 text-orange-200"
                : "border-purple-500 bg-purple-950 text-purple-200"}`}
          >
            {chip.text}
            {isCracking && chip.crackAt !== undefined && (
              <div style={{
                position:   "absolute",
                left:       `${chip.crackAt * 100}%`,
                top:        0,
                bottom:     0,
                width:      "1.5px",
                background: "rgba(251,146,60,0.9)",
                animation:  `crack ${CRACK_MS}ms ease-in forwards`,
              }} />
            )}
          </div>
        );
      })}
      <style>{`
        @keyframes crack {
          0%   { opacity: 0; transform: scaleY(0); }
          60%  { opacity: 1; transform: scaleY(1.1); }
          100% { opacity: 1; transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}