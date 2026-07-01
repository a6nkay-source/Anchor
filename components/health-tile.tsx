"use client";

import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/animated-number";

interface HealthTileProps {
  label: string;
  value: number | string;
  unit?: string;
  hint?: string;
  accent?: "cyan" | "emerald" | "violet" | "rose" | "amber" | "slate";
  arc?: number; // 0-100 for the little arc
  unavailable?: boolean;
  className?: string;
}

const accentColor: Record<string, string> = {
  cyan: "#67e8f9",
  emerald: "#6ee7b7",
  violet: "#a78bfa",
  rose: "#fda4af",
  amber: "#fcd34d",
  slate: "#94a3b8",
};

export function HealthTile({
  label,
  value,
  unit,
  hint,
  accent = "cyan",
  arc,
  unavailable,
  className,
}: HealthTileProps) {
  const color = accentColor[accent];
  const arcVal = Math.max(0, Math.min(100, arc ?? 0));

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 transition-colors",
        unavailable
          ? "border-dashed border-neutral-800 bg-neutral-950/40"
          : "border-neutral-900 bg-neutral-950/60",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
        style={{ background: unavailable ? "transparent" : `${color}22` }}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          {label}
        </p>
        {arc !== undefined && !unavailable && (
          <svg width={32} height={32} viewBox="0 0 32 32" className="-rotate-90">
            <circle cx="16" cy="16" r="12" stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="none" />
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke={color}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 12}
              strokeDashoffset={2 * Math.PI * 12 * (1 - arcVal / 100)}
              style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.2,0.7,0.2,1)" }}
            />
          </svg>
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        {unavailable ? (
          <span className="text-lg font-medium text-neutral-600">—</span>
        ) : typeof value === "number" ? (
          <AnimatedNumber value={value} className="text-2xl font-semibold tabular-nums text-neutral-100" />
        ) : (
          <span className="text-2xl font-semibold tabular-nums text-neutral-100">
            {value}
          </span>
        )}
        {unit && !unavailable && (
          <span className="text-xs text-neutral-500">{unit}</span>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        {unavailable ? "no device connected" : hint}
      </p>
    </div>
  );
}
