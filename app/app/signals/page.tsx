"use client";

import { Card } from "@/components/ui/card";
import { useSignals } from "@/components/signals-store";
import { Camera, Keyboard, Mic, Activity } from "lucide-react";

const iconFor = {
  vision: Camera,
  typing: Keyboard,
  voice: Mic,
  system: Activity,
};

export default function SignalsPage() {
  const { state } = useSignals();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Signals</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-100 md:text-4xl">
          Everything Anchor has whispered.
        </h1>
      </div>

      <Card className="bg-neutral-950/60 p-6">
        {state.nudges.length === 0 ? (
          <div className="py-16 text-center text-sm text-neutral-500">
            Nothing yet. Turn on Vision or start typing, and Anchor will begin
            to notice.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-900">
            {state.nudges.map((n) => {
              const Icon = iconFor[n.source];
              return (
                <li key={n.id} className="flex items-start gap-4 py-4">
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 ring-1 ring-cyan-400/20">
                    <Icon className="h-4 w-4 text-cyan-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                        {n.source}
                      </span>
                      <span className="text-xs tabular-nums text-neutral-600">
                        {new Date(n.ts).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-200">
                      {n.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
