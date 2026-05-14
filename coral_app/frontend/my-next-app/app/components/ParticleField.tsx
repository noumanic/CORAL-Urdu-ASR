"use client";
import { useEffect, useState } from "react";

interface P { l: number; t: number; d: number; o: number; dur: number; s: number; }

export default function ParticleField({ count = 40, className = "" }: { count?: number; className?: string }) {
  const [parts, setParts] = useState<P[]>([]);

  useEffect(() => {
    const arr: P[] = Array.from({ length: count }).map((_, i) => ({
      l: (i * 137) % 100 + Math.random() * 4 - 2,
      t: (i * 73)  % 100 + Math.random() * 4 - 2,
      d: Math.random() * 5,
      o: 0.2 + Math.random() * 0.6,
      dur: 6 + Math.random() * 6,
      s: 1 + Math.random() * 2.5,
    }));
    setParts(arr);
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden>
      {parts.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left:                  `${p.l}%`,
            top:                   `${p.t}%`,
            width:                 `${p.s}px`,
            height:                `${p.s}px`,
            background:            i % 5 === 0 ? "#22d3ee" : i % 7 === 0 ? "#a78bfa" : i % 11 === 0 ? "#ff6b6b" : "#ffffff",
            opacity:               p.o,
            boxShadow:             `0 0 ${p.s * 4}px currentColor`,
            color:                 i % 5 === 0 ? "#22d3ee" : i % 7 === 0 ? "#a78bfa" : i % 11 === 0 ? "#ff6b6b" : "#ffffff",
            animation:             `float ${p.dur}s ease-in-out infinite, pulseSoft ${p.dur * 0.6}s ease-in-out infinite`,
            animationDelay:        `${p.d}s, ${p.d * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}
