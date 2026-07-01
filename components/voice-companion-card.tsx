"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CallModal } from "@/components/call-modal";

export function VoiceCompanionCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="relative overflow-hidden bg-neutral-950/60 p-8">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-neutral-100">Voice companion</h3>
          <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-cyan-300" />
            ready
          </span>
        </div>
        <div className="mt-6 flex h-16 items-end gap-1">
          {[24, 40, 58, 72, 48, 32, 56, 70, 44, 28, 50, 66, 38, 24, 46].map((h, i) => (
            <span
              key={i}
              className="w-1.5 animate-drift rounded-full bg-gradient-to-t from-cyan-500/60 to-cyan-300"
              style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950 transition-transform hover:scale-[1.02]"
        >
          <Mic className="h-4 w-4" />
          Start a 30-second call
        </button>
      </Card>

      <CallModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
