"use client";

import { cn } from "@/lib/utils";

interface SignalBarProps {
  label: string;
  value: number;
  hint?: string;
  className?: string;
}

export function SignalBar({ label, value, hint, className }: SignalBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-neutral-300">{label}</span>
        <span className="text-xs tabular-nums text-neutral-500">{pct}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
