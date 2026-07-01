"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { HealthTile } from "@/components/health-tile";
import { AIRecommendation } from "@/components/ai-recommendation";
import { useSignals } from "@/components/signals-store";
import { Eye, Armchair, Timer } from "lucide-react";

const STRETCHES = [
  { label: "Neck rolls", why: "release trapezius tightness", duration: "60s" },
  { label: "Shoulder blade squeeze", why: "counter rounded posture", duration: "10 reps" },
  { label: "Chin tucks", why: "reset neck angle", duration: "10 reps" },
  { label: "Wrist circles", why: "typing fatigue", duration: "45s" },
  { label: "20-20-20 gaze", why: "eye strain relief", duration: "20s" },
  { label: "Thoracic extension", why: "open the chest", duration: "30s" },
];

export default function ErgonomicsPage() {
  const { state, metrics } = useSignals();
  const v = state.vision;

  // Estimated screen distance from face bbox height — larger face = closer.
  // We don't have baseline in inches, so present a relative "close/comfortable/far".
  const distanceLabel = v.active
    ? v.postureScore > 78
      ? "comfortable (arm's length)"
      : v.postureScore > 55
      ? "leaning in a bit"
      : "too close — sit back"
    : "camera off";

  return (
    <div>
      <PageHeader
        eyebrow="Wellness"
        title="Eye & musculoskeletal health."
        subtitle="Every ergonomic signal the camera can see, plus stretches you can do at your desk."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthTile label="Eye strain" value={Math.round(metrics.eyeStrain)} arc={metrics.eyeStrain} accent="amber" hint="from blink rate" unavailable={!v.active} />
        <HealthTile label="Blink health" value={Math.round(v.blinkRate)} unit="/min" arc={Math.min(100, v.blinkRate * 5)} accent="cyan" hint={v.blinkRate < 6 ? "very locked in" : v.blinkRate > 22 ? "restless" : "healthy"} unavailable={!v.active} />
        <HealthTile label="Screen distance" value={distanceLabel} accent="cyan" unavailable={!v.active} />
        <HealthTile label="Posture quality" value={Math.round(v.postureScore)} arc={v.postureScore} accent="emerald" unavailable={!v.active} />
        <HealthTile label="Neck angle" value={Math.round(metrics.neckPosition)} arc={metrics.neckPosition} accent="emerald" hint="100 = neutral" unavailable={!v.active} />
        <HealthTile label="Shoulder position" value={Math.round(metrics.shoulderPosition)} arc={metrics.shoulderPosition} accent="emerald" hint="100 = level" unavailable={!v.active} />
        <HealthTile label="Jaw tension" value={100 - Math.round(v.jawTension * 100)} arc={100 - v.jawTension * 100} accent="rose" unavailable={!v.active} />
        <HealthTile label="Facial tension" value={100 - Math.round(metrics.facialTension)} arc={100 - metrics.facialTension} accent="rose" unavailable={!v.active} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-neutral-950/60 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Timer className="h-4 w-4 text-cyan-300" />
            <h3 className="text-sm font-medium text-neutral-100">Stretch reminders</h3>
          </div>
          <p className="mb-4 text-xs text-neutral-500">
            Anchor picks one every ~40 minutes during Focus Mode. Do them slowly.
          </p>
          <ul className="grid gap-2 md:grid-cols-2">
            {STRETCHES.map((s) => (
              <li
                key={s.label}
                className="rounded-lg border border-neutral-900 bg-black/40 px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-100">{s.label}</span>
                  <span className="text-[10px] text-neutral-500">{s.duration}</span>
                </div>
                <p className="mt-0.5 text-xs text-neutral-500">{s.why}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="bg-neutral-950/60 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Armchair className="h-4 w-4 text-emerald-300" />
            <h3 className="text-sm font-medium text-neutral-100">Desk setup checklist</h3>
          </div>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li>· Top of screen at eye level.</li>
            <li>· Screen an arm's length away.</li>
            <li>· Feet flat, knees at 90°.</li>
            <li>· Shoulders back, forearms parallel to the floor.</li>
            <li>· Overhead + side light, no glare on the screen.</li>
          </ul>
          <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
            <Eye className="h-3 w-3" /> 20–20–20 rule: every 20 min, look 20 ft away for 20 s.
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <AIRecommendation
          systemPrompt="You are Anchor. In 3 short sentences, name the one ergonomic thing that will help the most in the next hour and how to do it. No lists."
          context={`Posture ${Math.round(v.postureScore)}, blink ${v.blinkRate.toFixed(1)}/min, jaw tension ${(v.jawTension * 100).toFixed(0)}, brow tension ${(v.browTension * 100).toFixed(0)}. Screen distance: ${distanceLabel}.`}
          title="One fix this hour"
        />
      </div>
    </div>
  );
}
