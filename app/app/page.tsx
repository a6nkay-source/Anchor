"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Keyboard, Mic, ArrowRight, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WellnessRing } from "@/components/wellness-ring";
import { SignalBar } from "@/components/signal-bar";
import { useSignals } from "@/components/signals-store";
import { DailyCompanion } from "@/components/daily-companion";

export default function Overview() {
  const { state, wellnessScore, wellnessLabel } = useSignals();
  const v = state.vision;
  const t = state.typing;

  const [timeStr, setTimeStr] = useState("Now");
  useEffect(() => {
    const update = () =>
      setTimeStr(
        new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      );
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <DailyCompanion />

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
          Now
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-100 md:text-3xl">
          {timeStr}. {wellnessLabel[0].toUpperCase() + wellnessLabel.slice(1)}.
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center bg-gradient-to-br from-neutral-950 to-neutral-900 p-8">
          <WellnessRing score={wellnessScore} />
          <p className="mt-6 max-w-xs text-center text-sm text-neutral-300">
            {v.active || t.active
              ? "Live wellness, computed right now from what Anchor sees and hears."
              : "Open a tab to start feeding the score. Vision needs the camera. Typing needs a few keystrokes."}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-xs text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {wellnessLabel}
          </span>
        </Card>

        <Card className="bg-neutral-950/60 p-8 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-medium text-neutral-100">Signals</h2>
            <span className="text-xs text-neutral-500">live</span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <SignalBar
              label="Posture"
              value={Math.round(v.postureScore)}
              hint={v.active ? (v.postureScore > 70 ? "Holding well." : "Slipping forward.") : "Vision off."}
            />
            <SignalBar
              label="Blink rate"
              value={Math.min(100, Math.round(v.blinkRate * 5))}
              hint={v.active ? `${v.blinkRate.toFixed(0)} / min` : "Vision off."}
            />
            <SignalBar
              label="Typing rhythm"
              value={Math.round(t.hesitationScore)}
              hint={t.active ? `${t.wpm.toFixed(0)} wpm` : "Typing off."}
            />
            <SignalBar
              label="Backspace ratio"
              value={100 - Math.round(t.backspaceRatio * 100 * 2.5)}
              hint={t.active ? `${(t.backspaceRatio * 100).toFixed(0)}% deletions` : "Typing off."}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <TabTile
          href="/app/vision"
          icon={Camera}
          title="Vision"
          body="Open the camera and let Anchor read posture, gaze, and expression in real time."
          active={v.active}
        />
        <TabTile
          href="/app/typing"
          icon={Keyboard}
          title="Typing"
          body="Type in the pad and watch WPM, hesitations, and backspacing chart live."
          active={t.active}
        />
        <TabTile
          href="/app/voice"
          icon={Mic}
          title="Voice"
          body="Have a 30-second grounding call with Anchor whenever you need one."
          active={false}
        />
      </div>

      <Card className="bg-neutral-950/60 p-6">
        <div className="flex items-start gap-4">
          <MessageCircle className="mt-1 h-5 w-5 shrink-0 text-cyan-300" />
          <div className="text-sm text-neutral-300">
            The nudge agent is running quietly in the background. Any time a
            signal drifts, Anchor may whisper one small thing. You can see
            everything it&apos;s said in{" "}
            <Link href="/app/signals" className="text-cyan-300 hover:underline">
              Signals
            </Link>
            .
          </div>
        </div>
      </Card>
    </div>
  );
}

function TabTile({
  href,
  icon: Icon,
  title,
  body,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  active: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="group relative h-full overflow-hidden bg-neutral-950/60 p-6 transition-colors hover:border-cyan-400/30">
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 ring-1 ring-cyan-400/20">
            <Icon className="h-4 w-4 text-cyan-300" />
          </div>
          {active && (
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              live
            </span>
          )}
        </div>
        <h3 className="text-lg font-medium text-neutral-100">{title}</h3>
        <p className="mt-1.5 text-sm text-neutral-400">{body}</p>
        <ArrowRight className="mt-4 h-4 w-4 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
      </Card>
    </Link>
  );
}
