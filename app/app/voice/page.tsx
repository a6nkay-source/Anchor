"use client";

import { useState } from "react";
import { Mic, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CallModal } from "@/components/call-modal";

export default function VoicePage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Voice</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-100 md:text-4xl">
          A thirty-second call whenever you need one.
        </h1>
      </div>

      <Card className="relative overflow-hidden bg-neutral-950/60 p-8">
        <div className="flex items-end gap-1 h-24">
          {[24, 40, 58, 72, 48, 32, 56, 70, 44, 28, 50, 66, 38, 24, 46, 62, 40, 30, 52, 68].map(
            (h, i) => (
              <span
                key={i}
                className="w-1.5 animate-drift rounded-full bg-gradient-to-t from-cyan-500/60 to-cyan-300"
                style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
              />
            )
          )}
        </div>

        <p className="mt-8 max-w-lg text-sm leading-relaxed text-neutral-400">
          Anchor will listen for thirty seconds. Say what&apos;s on your mind
          — Anchor speaks back gently and offers one small grounding thing.
          The call ends on its own.
        </p>

        <button
          onClick={() => setOpen(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-neutral-950 transition-transform hover:scale-[1.02]"
        >
          <Mic className="h-4 w-4" />
          Start a 30-second call
          <ArrowRight className="h-4 w-4" />
        </button>
      </Card>

      <Card className="bg-neutral-950/60 p-6 text-sm text-neutral-400">
        Your microphone stays on only during the call. Nothing is recorded —
        the transcript lives in this tab and disappears when you close it.
      </Card>

      <CallModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
