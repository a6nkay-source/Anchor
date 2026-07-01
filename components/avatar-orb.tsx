"use client";

import { useSignals } from "@/components/signals-store";
import { cn } from "@/lib/utils";

// The orb's tint and pulse speed subtly react to the student's state.
// - Calm palette when stress goes up
// - Slower pulse when the student needs to relax
// - Bright cyan and a hint of yellow when focus is high (flow)
export function AvatarOrb({ size = 96, className }: { size?: number; className?: string }) {
  const { metrics } = useSignals();
  const flow = metrics.focus > 75 && metrics.stress < 45;
  const heavy = metrics.stress > 65 || metrics.fatigue > 65;

  const inner = flow
    ? "linear-gradient(135deg, #67e8f9, #fef08a)"
    : heavy
    ? "linear-gradient(135deg, #a78bfa, #67e8f9)"
    : "linear-gradient(135deg, #67e8f9, #86efac)";
  const outer = flow
    ? "hsl(48 100% 70% / 0.35)"
    : heavy
    ? "hsl(265 80% 65% / 0.35)"
    : "hsl(188 90% 60% / 0.35)";
  const pulseSpeed = heavy ? "6s" : flow ? "3.2s" : "4s";

  // Mood glyph — a small marker that shifts between calm, thoughtful, celebrating
  const mood =
    flow ? "flow" : heavy ? "hold" : metrics.focus > 60 ? "steady" : "listening";

  return (
    <div className={cn("relative inline-block", className)} style={{ width: size, height: size }}>
      <div
        aria-hidden
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background: outer,
          animation: `orb-breathe ${pulseSpeed} ease-in-out infinite`,
        }}
      />
      <div
        className="absolute inset-2 rounded-full"
        style={{
          background: inner,
          animation: `orb-breathe ${pulseSpeed} ease-in-out infinite`,
        }}
      />
      <div className="absolute inset-6 rounded-full bg-black/50 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] uppercase tracking-[0.24em] text-neutral-200/80">
          {mood}
        </span>
      </div>
      <style>{`
        @keyframes orb-breathe {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.05); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
