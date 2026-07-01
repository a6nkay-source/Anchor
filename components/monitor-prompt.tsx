"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useMonitor } from "@/components/wellness-monitor";
import { primeSpeech } from "@/lib/speech";
import { Camera, X, Volume2 } from "lucide-react";

// A gentle one-time banner that asks for camera + audio permissions so
// Anchor can run always-on. Dismissable and remembered.
export function MonitorPrompt() {
  const { phase, permission, start } = useMonitor();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const d = localStorage.getItem("anchor.monitor.prompt.dismissed") === "true";
      setDismissed(d);
    } catch {
      setDismissed(false);
    }
  }, []);

  // Hide once monitoring is on, permission is denied, or user dismissed.
  if (phase === "running" || phase === "loading-model" || phase === "requesting-camera") {
    return null;
  }
  if (permission === "denied") return null;
  if (dismissed) return null;

  const enable = async () => {
    primeSpeech();
    await start();
    try {
      localStorage.setItem("anchor.monitor.prompt.dismissed", "true");
    } catch {}
    setDismissed(true);
  };

  return (
    <Card className="mb-6 flex items-center justify-between gap-4 border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-emerald-500/5 p-4">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 ring-1 ring-cyan-400/30">
          <Camera className="h-4 w-4 text-cyan-200" />
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-100">
            Enable always-on monitoring
          </p>
          <p className="mt-0.5 text-xs text-neutral-400">
            Anchor works best with the camera and sound on. It reads posture,
            gaze, blinks, and typing rhythm — and whispers back every 30 seconds.
            Frames never leave your device.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={enable}
          className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
        >
          <Volume2 className="h-3.5 w-3.5" /> Enable
        </button>
        <button
          onClick={() => {
            try {
              localStorage.setItem("anchor.monitor.prompt.dismissed", "true");
            } catch {}
            setDismissed(true);
          }}
          className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}
