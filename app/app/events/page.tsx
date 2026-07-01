"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useSignals } from "@/components/signals-store";
import { Armchair, Eye, Wind, Zap, Timer, Coffee, MousePointer2, LogOut, Gauge, Info } from "lucide-react";

const ICON: Record<string, any> = {
  "poor-posture": Armchair,
  "eye-strain": Eye,
  "low-blink-rate": Eye,
  "mental-fatigue": Wind,
  "high-stress": Zap,
  "long-sitting": Timer,
  "excessive-distractions": MousePointer2,
  "left-focus": LogOut,
  "low-productivity": Gauge,
  "no-breaks": Coffee,
};

export default function EventsPage() {
  const { state } = useSignals();

  return (
    <div>
      <PageHeader
        eyebrow="Wellness"
        title="Wellness events."
        subtitle="Every moment Anchor gently flagged during a session — never as violations, just as observations."
      />

      {state.events.length === 0 ? (
        <Card className="p-10 text-center text-sm text-neutral-500">
          Nothing flagged. Turn on Vision and start a Focus block, and events
          will appear here as they happen.
        </Card>
      ) : (
        <ul className="space-y-2">
          {state.events.map((e) => {
            const Icon = ICON[e.kind] ?? Info;
            const tone =
              e.severity === "urgent"
                ? "border-rose-400/30 bg-rose-500/5"
                : e.severity === "notable"
                ? "border-amber-400/30 bg-amber-500/5"
                : "border-neutral-900 bg-neutral-950/60";
            return (
              <li key={e.id} className={`flex items-start gap-3 rounded-xl border p-4 ${tone}`}>
                <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40 ring-1 ring-white/5">
                  <Icon className="h-4 w-4 text-neutral-200" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      {e.kind.replace(/-/g, " ")} · {e.severity}
                    </span>
                    <span className="text-[10px] tabular-nums text-neutral-500">
                      {new Date(e.ts).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-100">{e.message}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
