"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface WellnessRingProps {
  score: number;
  className?: string;
  size?: number;
}

export function WellnessRing({ score, className, size = 220 }: WellnessRingProps) {
  const [displayed, setDisplayed] = useState(0);
  const displayedRef = useRef(0);
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (displayed / 100) * c;

  useEffect(() => {
    let raf = 0;
    const from = displayedRef.current;
    const start = performance.now();
    const duration = 700;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(from + (score - from) * eased);
      displayedRef.current = next;
      setDisplayed(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 drop-shadow-[0_0_24px_hsl(188_90%_55%/0.35)]">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(188 90% 60%)" />
            <stop offset="100%" stopColor="hsl(160 80% 55%)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(220 20% 14%)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 100ms linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-semibold tabular-nums tracking-tight text-neutral-50">
          {displayed}
        </span>
        <span className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-400">
          wellness
        </span>
      </div>
    </div>
  );
}
