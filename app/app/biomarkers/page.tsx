"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { HealthTile } from "@/components/health-tile";
import { AIRecommendation } from "@/components/ai-recommendation";
import { useSignals } from "@/components/signals-store";
import { Waves, Activity } from "lucide-react";

export default function BiomarkersPage() {
  const { state, metrics } = useSignals();
  const v = state.vision;
  const t = state.typing;
  const voice = state.voice;

  // A single "cognitive load" composite for the hero.
  const cognitiveLoad = Math.round(
    metrics.stress * 0.4 + metrics.fatigue * 0.35 + (100 - metrics.focus) * 0.25
  );

  const context = `Cognitive load ${cognitiveLoad}. Posture ${Math.round(v.postureScore)}, blink ${v.blinkRate.toFixed(1)}/min, gaze ${(v.gazeCentered * 100).toFixed(0)}, jaw ${(v.jawTension * 100).toFixed(0)}, brow ${(v.browTension * 100).toFixed(0)}, expression ${v.expression}. Typing ${t.wpm.toFixed(0)} wpm, ${(t.backspaceRatio * 100).toFixed(0)}% backspaces, cadence-variance ${(t.cadenceVariance * 100).toFixed(0)}, hesitation ${Math.round(t.hesitationScore)}. Voice conf ${Math.round(voice.confidence)}, pace ${Math.round(voice.pace)}wpm.`;

  return (
    <div>
      <PageHeader
        eyebrow="Wellness"
        title="Digital biomarkers."
        subtitle="Every subtle signal — combined into one read of your cognitive health."
      />

      <Card className="relative overflow-hidden bg-gradient-to-br from-neutral-950 to-neutral-900 p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-400/15 blur-3xl" />
        <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">Cognitive load</p>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-7xl font-semibold tabular-nums text-neutral-100">{cognitiveLoad}</span>
          <span className="text-sm text-neutral-500">/100</span>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          {cognitiveLoad < 40 ? "Light load — cruising." : cognitiveLoad < 65 ? "Working, but sustainable." : cognitiveLoad < 82 ? "Heavier — consider a short break soon." : "Overloaded — pause."}
        </p>
      </Card>

      <SectionLabel>Motor & rhythm</SectionLabel>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthTile label="Typing cadence" value={Math.round(t.wpm)} unit="wpm" arc={Math.min(100, t.wpm)} accent="cyan" hint="rolling avg" unavailable={!t.active} />
        <HealthTile label="Correction rate" value={Math.round(t.backspaceRatio * 100)} unit="%" arc={100 - Math.min(100, t.backspaceRatio * 250)} accent="rose" hint="lower is smoother" unavailable={!t.active} />
        <HealthTile label="Hesitation" value={Math.round(t.hesitationScore)} arc={t.hesitationScore} accent="emerald" hint="higher = smoother" unavailable={!t.active} />
        <HealthTile label="Rhythm steadiness" value={100 - Math.round(t.cadenceVariance * 100)} arc={100 - t.cadenceVariance * 100} accent="cyan" hint="1−variance" unavailable={!t.active} />
      </div>

      <SectionLabel>Perceptual</SectionLabel>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthTile label="Posture" value={Math.round(v.postureScore)} arc={v.postureScore} accent="emerald" unavailable={!v.active} />
        <HealthTile label="Gaze" value={Math.round(v.gazeCentered * 100)} arc={v.gazeCentered * 100} accent="cyan" unavailable={!v.active} />
        <HealthTile label="Blink rate" value={Math.round(v.blinkRate)} unit="/min" arc={Math.min(100, v.blinkRate * 5)} accent="cyan" unavailable={!v.active} />
        <HealthTile label="Facial tension" value={Math.round(metrics.facialTension)} arc={metrics.facialTension} accent="rose" unavailable={!v.active} />
      </div>

      <SectionLabel>Voice</SectionLabel>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthTile label="Voice confidence" value={Math.round(voice.confidence)} arc={voice.confidence} accent="cyan" hint="from last call" unavailable={!voice.lastReply} />
        <HealthTile label="Speaking pace" value={Math.round(voice.pace)} unit="wpm" arc={Math.min(100, voice.pace)} accent="emerald" hint="from last call" unavailable={!voice.lastReply} />
      </div>

      <AIRecommendation
        systemPrompt="You are Anchor. In 3 short sentences, translate these biomarkers into ONE small, concrete change to protect the student's brain this hour. Warm, not clinical."
        context={context}
        title="What your body is telling us"
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-neutral-500">
      <Activity className="h-3 w-3" /> {children}
    </div>
  );
}
