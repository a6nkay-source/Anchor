"use client";

import { useEffect, useState } from "react";
import { useSignals, type WellnessEvent } from "@/components/signals-store";
import { speak } from "@/lib/speech";
import {
  Armchair,
  Eye,
  Zap,
  Wind,
  Timer,
  Coffee,
  MousePointer2,
  LogOut,
  Gauge,
  Snowflake,
  X,
  Info,
} from "lucide-react";

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

const AUTO_DISMISS_MS = 9_000;

export function EventToasts() {
  const { state, clearEvent } = useSignals();
  const [muted, setMuted] = useState(false);
  const [spokenIds, setSpokenIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("anchor.settings.v1");
      if (raw) {
        const s = JSON.parse(raw);
        setMuted(s?.notifications === false);
      }
    } catch {}
  }, []);

  // Speak newly arrived events (throttled by kind cooldown upstream)
  useEffect(() => {
    if (muted) return;
    for (const e of state.events.slice(0, 3)) {
      if (spokenIds.has(e.id)) continue;
      speak(e.message);
      setSpokenIds((s) => {
        const n = new Set(s);
        n.add(e.id);
        return n;
      });
      // one at a time so lines don't stack
      break;
    }
  }, [state.events, muted, spokenIds]);

  // Auto-dismiss stale toasts
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      for (const e of state.events) {
        if (now - e.ts > AUTO_DISMISS_MS) clearEvent(e.id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state.events, clearEvent]);

  const visible = state.events.filter((e) => Date.now() - e.ts < AUTO_DISMISS_MS).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-col-reverse gap-2">
      {visible.map((e, i) => (
        <ToastCard
          key={e.id}
          event={e}
          onDismiss={() => clearEvent(e.id)}
          delay={i * 60}
        />
      ))}
    </div>
  );
}

function ToastCard({
  event,
  onDismiss,
  delay,
}: {
  event: WellnessEvent;
  onDismiss: () => void;
  delay: number;
}) {
  const Icon = ICON[event.kind] ?? Info;
  const tone =
    event.severity === "urgent"
      ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
      : event.severity === "notable"
      ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
      : "border-cyan-400/40 bg-cyan-500/10 text-cyan-100";

  return (
    <div
      className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${tone}`}
      style={{
        opacity: 0,
        transform: "translateY(8px)",
        animation: `toast-in 320ms cubic-bezier(0.2,0.7,0.2,1) ${delay}ms forwards`,
      }}
    >
      <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/30">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">
          {event.kind.replace(/-/g, " ")}
        </div>
        <div className="mt-0.5 text-sm leading-snug">{event.message}</div>
      </div>
      <button
        onClick={onDismiss}
        className="rounded p-1 opacity-70 hover:bg-black/20 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <style>{`
        @keyframes toast-in {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
