"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  to:         number;
  duration?:  number;
  suffix?:    string;
  prefix?:    string;
  decimals?:  number;
  className?: string;
}

export default function Counter({ to, duration = 1600, suffix = "", prefix = "", decimals = 0, className = "" }: Props) {
  const [val, setVal]      = useState(0);
  const ref                = useRef<HTMLSpanElement>(null);
  const started            = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const t   = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setVal(eased * to);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}{val.toFixed(decimals)}{suffix}
    </span>
  );
}
