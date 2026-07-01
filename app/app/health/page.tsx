"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { HealthTile } from "@/components/health-tile";
import { useSignals } from "@/components/signals-store";
import { Bluetooth, Watch, Waves, HeartPulse } from "lucide-react";

export default function HealthPage() {
  const { state, metrics, updateWearable } = useSignals();
  const v = state.vision;
  const t = state.typing;
  const w = state.wearable;

  const simulateConnect = () => {
    // Mock a wearable pairing — clearly labeled in the UI.
    updateWearable({
      connected: true,
      deviceName: "Apple Watch (simulated)",
      heartRate: 72,
      hrv: 48,
      spO2: 98,
      respiratoryRate: 14,
      bloodPressure: "118/76",
    });
  };
  const simulateDisconnect = () =>
    updateWearable({
      connected: false,
      deviceName: null,
      heartRate: undefined,
      hrv: undefined,
      spO2: undefined,
      respiratoryRate: undefined,
      bloodPressure: undefined,
    });

  return (
    <div>
      <PageHeader
        eyebrow="Health"
        title="Health Dashboard."
        subtitle="Every signal Anchor reads — real from the browser, estimated from those signals, or unavailable if no device is connected."
        actions={
          <div className="flex items-center gap-2 text-xs">
            {w.connected ? (
              <button
                onClick={simulateDisconnect}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-rose-200 hover:border-rose-400/60"
              >
                <Watch className="h-3.5 w-3.5" /> Disconnect {w.deviceName}
              </button>
            ) : (
              <button
                onClick={simulateConnect}
                className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-cyan-200 hover:border-cyan-400/60"
              >
                <Bluetooth className="h-3.5 w-3.5" /> Simulate wearable pair
              </button>
            )}
          </div>
        }
      />

      <SectionLabel>Cognitive state</SectionLabel>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthTile label="Focus" value={metrics.focus} arc={metrics.focus} accent="cyan" hint="sustained-attention proxy" />
        <HealthTile label="Productivity" value={metrics.productivity} arc={metrics.productivity} accent="emerald" hint="speed × focus" />
        <HealthTile label="Wellness" value={metrics.wellness} arc={metrics.wellness} accent="violet" hint="composite" />
        <HealthTile label="Stress" value={metrics.stress} arc={metrics.stress} accent="rose" hint="from tension + fatigue" />
        <HealthTile label="Fatigue" value={metrics.fatigue} arc={metrics.fatigue} accent="amber" hint="low blinks + hesitation" />
        <HealthTile label="Burnout risk" value={metrics.burnoutRisk} arc={metrics.burnoutRisk} accent="rose" hint="sustained low wellness" />
        <HealthTile label="Mood" value={metrics.mood} accent="cyan" hint="from expression + tension" />
        <HealthTile label="Energy" value={metrics.energy} arc={metrics.energy} accent="emerald" hint="typing × wellness" />
      </div>

      <SectionLabel>Vision-derived</SectionLabel>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthTile label="Eye strain" value={metrics.eyeStrain} arc={metrics.eyeStrain} accent="amber" hint={v.active ? "based on blink rate" : "camera off"} unavailable={!v.active} />
        <HealthTile label="Blink rate" value={Math.round(v.blinkRate)} unit="/min" arc={Math.min(100, v.blinkRate * 5)} accent="cyan" hint={v.blinkRate < 6 ? "very locked in" : v.blinkRate > 22 ? "restless" : "healthy"} unavailable={!v.active} />
        <HealthTile label="Posture" value={Math.round(v.postureScore)} arc={v.postureScore} accent="emerald" hint={v.postureScore > 75 ? "sitting well" : "slipping"} unavailable={!v.active} />
        <HealthTile label="Neck position" value={Math.round(metrics.neckPosition)} arc={metrics.neckPosition} accent="emerald" hint="neutral = 100" unavailable={!v.active} />
        <HealthTile label="Shoulder position" value={Math.round(metrics.shoulderPosition)} arc={metrics.shoulderPosition} accent="emerald" hint="neutral = 100" unavailable={!v.active} />
        <HealthTile label="Jaw tension" value={Math.round(v.jawTension * 100)} arc={v.jawTension * 100} accent="rose" hint={v.jawTension > 0.55 ? "clenched" : "soft"} unavailable={!v.active} />
        <HealthTile label="Facial tension" value={Math.round(metrics.facialTension)} arc={metrics.facialTension} accent="rose" hint="jaw + brow blend" unavailable={!v.active} />
        <HealthTile label="Expression" value={v.expression} accent="violet" hint="from blendshapes" unavailable={!v.active} />
      </div>

      <SectionLabel>Typing-derived</SectionLabel>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthTile label="Typing fatigue" value={Math.round(metrics.typingFatigue)} arc={metrics.typingFatigue} accent="amber" hint="from cadence + hesitation" unavailable={!t.active} />
        <HealthTile label="Typing accuracy" value={Math.round(t.accuracy)} unit="%" arc={t.accuracy} accent="emerald" hint="100 − backspace ratio" unavailable={!t.active} />
        <HealthTile label="Typing rhythm" value={Math.round(t.hesitationScore)} arc={t.hesitationScore} accent="cyan" hint="steadier = higher" unavailable={!t.active} />
        <HealthTile label="Speed" value={Math.round(t.wpm)} unit="wpm" arc={Math.min(100, t.wpm)} accent="violet" hint="rolling avg" unavailable={!t.active} />
      </div>

      <SectionLabel>Voice-derived</SectionLabel>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthTile label="Voice confidence" value={Math.round(state.voice.confidence)} arc={state.voice.confidence} accent="cyan" hint="last call" unavailable={!state.voice.lastReply} />
        <HealthTile label="Speaking pace" value={Math.round(state.voice.pace)} unit="wpm" arc={Math.min(100, state.voice.pace)} accent="emerald" hint="last call" unavailable={!state.voice.lastReply} />
      </div>

      <SectionLabel>
        Wearable metrics
        <span className="ml-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200">
          {w.connected ? "connected · demo" : "no device"}
        </span>
      </SectionLabel>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HealthTile label="Heart rate" value={w.heartRate ?? 0} unit="bpm" arc={w.heartRate ? (w.heartRate / 180) * 100 : 0} accent="rose" hint="resting" unavailable={!w.connected} />
        <HealthTile label="HRV" value={w.hrv ?? 0} unit="ms" arc={w.hrv ? Math.min(100, w.hrv * 1.6) : 0} accent="violet" hint="higher = calmer" unavailable={!w.connected} />
        <HealthTile label="SpO₂" value={w.spO2 ?? 0} unit="%" arc={w.spO2 ?? 0} accent="cyan" hint="blood oxygen" unavailable={!w.connected} />
        <HealthTile label="Respiratory" value={w.respiratoryRate ?? 0} unit="/min" arc={w.respiratoryRate ? w.respiratoryRate * 4 : 0} accent="emerald" hint="from device" unavailable={!w.connected} />
        <HealthTile label="Blood pressure" value={w.bloodPressure ?? "—"} accent="rose" hint="from device" unavailable={!w.bloodPressure} />
      </div>

      <Card className="bg-neutral-950/60 p-6 text-sm text-neutral-400">
        <div className="mb-2 flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-cyan-300" />
          <span className="text-neutral-200">How we compute these</span>
        </div>
        Real values (posture, blink rate, gaze, jaw/brow tension, WPM, backspace ratio,
        cadence variance) come straight from the browser. Derived values (focus, stress,
        fatigue, burnout risk, energy, mood, eye strain) are simple, transparent
        combinations of those signals. Anything requiring hardware — heart rate, HRV,
        SpO₂, respiratory rate, blood pressure — stays blank until a wearable is paired.
      </Card>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-neutral-500">
      <Waves className="h-3 w-3" /> {children}
    </div>
  );
}
