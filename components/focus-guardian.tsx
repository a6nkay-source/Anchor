"use client";

import { useEffect, useState } from "react";
import { useFocus } from "@/components/focus-mode";
import { useSignals } from "@/components/signals-store";
import { Shield, Coffee, X, ArrowRight } from "lucide-react";
import { speak } from "@/lib/speech";

const THRESHOLD = 4; // trigger after this many distractions in the current session
const REPEAT_WINDOW_MS = 4 * 60_000;

export function FocusGuardian() {
  const { active, distractionAttempts, stop } = useFocus();
  const { addNudge } = useSignals();
  const [open, setOpen] = useState(false);
  const [lastShownAt, setLastShownAt] = useState<number>(0);

  useEffect(() => {
    if (!active) {
      setOpen(false);
      return;
    }
    if (
      distractionAttempts >= THRESHOLD &&
      Date.now() - lastShownAt > REPEAT_WINDOW_MS
    ) {
      setOpen(true);
      setLastShownAt(Date.now());
      const line = "Hey — you keep drifting off. Want to keep going, or take two minutes to reset?";
      speak(line);
      addNudge({ source: "system", text: line });
    }
  }, [distractionAttempts, active, lastShownAt, addNudge]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-400/30 bg-neutral-950 p-6 shadow-2xl">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 rounded p-1 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 ring-1 ring-cyan-400/30">
          <Shield className="h-5 w-5 text-cyan-300" />
        </div>
        <h2 className="text-lg font-medium text-neutral-100">
          Small check-in.
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-300">
          You&apos;ve pulled away a few times. That&apos;s okay — noticing it is
          the whole game. Do you want to keep going, or take a quick reset?
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => setOpen(false)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
          >
            <ArrowRight className="h-4 w-4" /> Keep going
          </button>
          <button
            onClick={async () => {
              setOpen(false);
              await stop();
            }}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-200 hover:border-cyan-400/40"
          >
            <Coffee className="h-4 w-4" /> Take 2 min
          </button>
        </div>
      </div>
    </div>
  );
}
