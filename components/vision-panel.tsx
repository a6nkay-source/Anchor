"use client";

import { useEffect, useRef } from "react";
import { Camera, CameraOff, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SignalBar } from "@/components/signal-bar";
import { useSignals } from "@/components/signals-store";
import { useMonitor } from "@/components/wellness-monitor";

export function VisionPanel() {
  const { state, wellnessScore } = useSignals();
  const { phase, error, start, stop, attach } = useMonitor();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    attach(hostRef.current);
    return () => attach(null);
  }, [attach]);

  // style the grafted video and canvas
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const style = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.position = "absolute";
      el.style.inset = "0";
      el.style.width = "100%";
      el.style.height = "100%";
      el.style.transform = "scaleX(-1)";
      el.style.objectFit = "cover";
    };
    style(host.querySelector("video"));
    style(host.querySelector("canvas"));
  });

  const v = state.vision;
  const stateText =
    phase === "idle"
      ? "Camera off"
      : phase === "loading-model"
      ? "Loading face model…"
      : phase === "requesting-camera"
      ? "Waiting for permission…"
      : phase === "error"
      ? "Error"
      : v.faceDetected
      ? "Reading your face"
      : "No face in frame";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Vision</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-100 md:text-4xl">
            Live camera signals.
          </h1>
        </div>
        {phase === "running" ? (
          <button
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-rose-400/40"
          >
            <CameraOff className="h-4 w-4" /> Stop
          </button>
        ) : (
          <button
            onClick={start}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
          >
            <Camera className="h-4 w-4" /> Start camera
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="relative overflow-hidden bg-black">
          <div className="relative aspect-[4/3] w-full">
            <div ref={hostRef} className="absolute inset-0" />
            {phase !== "running" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/80 text-sm text-neutral-400">
                {phase === "idle" ? (
                  <>
                    <Camera className="h-6 w-6 text-neutral-500" />
                    Camera off. Anchor won&apos;t see anything until you turn it on.
                  </>
                ) : phase === "error" ? (
                  <>
                    <AlertTriangle className="h-6 w-6 text-rose-400" />
                    {error}
                  </>
                ) : (
                  <>
                    <span className="loader" />
                    {stateText}
                  </>
                )}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent p-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-neutral-300">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    phase === "running" ? "animate-pulse bg-emerald-400" : "bg-neutral-600"
                  }`}
                />
                {stateText}
              </span>
              <span className="text-neutral-500">wellness {wellnessScore}</span>
            </div>
          </div>
        </Card>

        <Card className="bg-neutral-950/60 p-6">
          <h3 className="mb-4 text-sm font-medium text-neutral-100">Live readings</h3>
          <div className="space-y-5">
            <SignalBar
              label="Posture"
              value={Math.round(v.postureScore)}
              hint={
                v.postureScore > 75
                  ? "Sitting well."
                  : v.postureScore > 55
                  ? "Slightly leaning."
                  : "Slumped forward."
              }
            />
            <SignalBar
              label="Gaze centered"
              value={Math.round(v.gazeCentered * 100)}
              hint={v.gazeCentered > 0.65 ? "Looking at the screen." : "Drifting."}
            />
            <SignalBar
              label="Blink rate"
              value={Math.min(100, Math.round(v.blinkRate * 5))}
              hint={`${v.blinkRate.toFixed(0)} / min · ${
                v.blinkRate < 6 ? "locked in" : v.blinkRate > 22 ? "distracted" : "healthy"
              }`}
            />
            <SignalBar
              label="Jaw tension"
              value={100 - Math.round(v.jawTension * 100)}
              hint={v.jawTension > 0.55 ? "Tight." : "Soft."}
            />
            <SignalBar
              label="Brow tension"
              value={100 - Math.round(v.browTension * 100)}
              hint={v.browTension > 0.55 ? "Furrowed." : "Relaxed."}
            />
            <div className="pt-2 text-xs text-neutral-500">
              expression: <span className="text-neutral-300">{v.expression}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="bg-neutral-950/60 p-6 text-sm text-neutral-400">
        Anchor runs the vision model locally. Frames never leave your device — only
        numeric signals feed the wellness score.
      </Card>
    </div>
  );
}
