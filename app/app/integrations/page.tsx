"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useSignals } from "@/components/signals-store";
import { Bluetooth, Watch, Info, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  name: string;
  vendor: string;
  metrics: string[];
  status: "available" | "coming-soon";
  color: string;
}

const PROVIDERS: Provider[] = [
  {
    id: "applehealth",
    name: "Apple Health",
    vendor: "Apple",
    metrics: ["Heart rate", "HRV", "Sleep", "Steps", "Mindful minutes"],
    status: "available",
    color: "#fca5a5",
  },
  {
    id: "applewatch",
    name: "Apple Watch",
    vendor: "Apple",
    metrics: ["Heart rate", "HRV", "Blood oxygen", "Sleep stages", "Activity"],
    status: "available",
    color: "#f472b6",
  },
  {
    id: "fitbit",
    name: "Fitbit",
    vendor: "Google",
    metrics: ["Heart rate", "Sleep score", "Stress", "Steps"],
    status: "available",
    color: "#67e8f9",
  },
  {
    id: "garmin",
    name: "Garmin",
    vendor: "Garmin",
    metrics: ["Body battery", "Stress", "HRV", "Recovery"],
    status: "available",
    color: "#a7f3d0",
  },
  {
    id: "oura",
    name: "Oura Ring",
    vendor: "Oura",
    metrics: ["Readiness", "Sleep", "HRV", "Body temp"],
    status: "available",
    color: "#c4b5fd",
  },
  {
    id: "whoop",
    name: "WHOOP",
    vendor: "WHOOP",
    metrics: ["Recovery", "Strain", "Sleep performance"],
    status: "coming-soon",
    color: "#fcd34d",
  },
  {
    id: "withings",
    name: "Withings",
    vendor: "Withings",
    metrics: ["Blood pressure", "Weight", "Sleep tracker"],
    status: "coming-soon",
    color: "#93c5fd",
  },
  {
    id: "googlefit",
    name: "Google Fit",
    vendor: "Google",
    metrics: ["Activity", "Heart points", "Sleep"],
    status: "coming-soon",
    color: "#fdba74",
  },
];

export default function IntegrationsPage() {
  const { state, updateWearable } = useSignals();
  const connectedId =
    state.wearable.connected && state.wearable.deviceName
      ? PROVIDERS.find((p) => state.wearable.deviceName!.startsWith(p.name))?.id
      : null;

  const connect = (p: Provider) => {
    // demo pairing — clearly labeled
    updateWearable({
      connected: true,
      deviceName: `${p.name} (simulated)`,
      heartRate: 72,
      hrv: 48,
      spO2: 98,
      respiratoryRate: 14,
      bloodPressure: p.id === "withings" ? "118/76" : undefined,
    });
  };

  const disconnect = () =>
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
        eyebrow="Wellness"
        title="Health integrations."
        subtitle="Optional. If no device is paired, Anchor labels wearable metrics as unavailable — it never invents medical measurements."
      />

      <Card className="mb-6 flex items-start gap-3 border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100/90">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div>
          Pairing here is a demo — Anchor writes a fake reading into the store
          so you can see the Health Dashboard react. Real pairing needs the
          native app (Electron or iOS) with each vendor's authorization flow.
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {PROVIDERS.map((p) => {
          const connected = connectedId === p.id;
          return (
            <Card
              key={p.id}
              className={cn(
                "relative overflow-hidden bg-neutral-950/60 p-5 transition-colors",
                connected && "border-emerald-400/40"
              )}
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
                style={{ background: `${p.color}22` }}
              />
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Watch className="h-4 w-4" style={{ color: p.color }} />
                    <span className="text-sm text-neutral-100">{p.name}</span>
                    {p.status === "coming-soon" && (
                      <span className="rounded-full border border-neutral-800 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-neutral-500">
                        coming
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-neutral-500">{p.vendor}</p>
                </div>
                {connected ? (
                  <button
                    onClick={disconnect}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-[11px] text-rose-200"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => p.status === "available" && connect(p)}
                    disabled={p.status !== "available"}
                    className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-200 hover:border-cyan-400/60 disabled:opacity-40"
                  >
                    <Bluetooth className="h-3 w-3" /> Connect
                  </button>
                )}
              </div>

              <ul className="mt-3 flex flex-wrap gap-1.5">
                {p.metrics.map((m) => (
                  <li
                    key={m}
                    className="rounded-full border border-neutral-800 bg-black/40 px-2 py-0.5 text-[10px] text-neutral-400"
                  >
                    {m}
                  </li>
                ))}
              </ul>

              {connected && (
                <div className="mt-3 inline-flex items-center gap-1 text-[10px] text-emerald-300">
                  <Check className="h-3 w-3" /> feeding Health Dashboard
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 bg-neutral-950/60 p-6 text-sm text-neutral-400">
        Anchor never fabricates medical measurements. Without a connected
        device, heart rate, HRV, SpO₂, and blood pressure stay blank across the
        app.
      </Card>
    </div>
  );
}
