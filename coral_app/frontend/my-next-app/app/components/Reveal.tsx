"use client";
import { useEffect, useRef, useState, ReactNode } from "react";

interface Props {
  children:   ReactNode;
  delay?:     number;
  className?: string;
  as?:        "div" | "section" | "li" | "ul" | "article" | "header" | "p";
}

export default function Reveal({ children, delay = 0, className = "", as = "div" }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); obs.disconnect(); }
    }, { threshold: 0.12, rootMargin: "-40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Tag = as as keyof React.JSX.IntrinsicElements;
  return (
    // @ts-expect-error generic element ref
    <Tag ref={ref} className={`reveal-on-scroll ${seen ? "in-view" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
