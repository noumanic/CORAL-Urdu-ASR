"use client";

export default function Waveform({ bars = 40, className = "" }: { bars?: number; className?: string }) {
  const arr = Array.from({ length: bars });
  return (
    <div className={`flex items-center gap-[3px] h-16 ${className}`} aria-hidden>
      {arr.map((_, i) => {
        const delay = (i * 0.05) % 1.6;
        const dur   = 0.9 + ((i * 13) % 9) / 10;
        const height = 0.4 + ((i * 7) % 10) / 10 * 0.6;
        return (
          <span
            key={i}
            className="block w-[3px] rounded-full"
            style={{
              height:                `${Math.round(height * 100)}%`,
              background:            i % 7 === 0
                ? "linear-gradient(180deg, #ff6b6b, #fbbf24)"
                : i % 5 === 0
                ? "linear-gradient(180deg, #22d3ee, #a78bfa)"
                : "linear-gradient(180deg, #e9eef9, #6f7a92)",
              animation:             "wave-bar ease-in-out infinite",
              animationDuration:     `${dur}s`,
              animationDelay:        `${delay}s`,
              transformOrigin:       "center",
            }}
          />
        );
      })}
    </div>
  );
}
