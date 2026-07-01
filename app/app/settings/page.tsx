"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import {
  Camera,
  Mic,
  Cpu,
  Users,
  Bell,
  Focus,
  Download,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE = "anchor.settings.v1";

interface Settings {
  camera: boolean;
  microphone: boolean;
  aiMonitoring: boolean;
  parentAccess: boolean;
  notifications: boolean;
  focusOnLaunch: boolean;
}

const DEFAULTS: Settings = {
  camera: false,
  microphone: false,
  aiMonitoring: true,
  parentAccess: false,
  notifications: true,
  focusOnLaunch: false,
};

const items: {
  key: keyof Settings;
  label: string;
  desc: string;
  icon: any;
}[] = [
  {
    key: "camera",
    label: "Camera access",
    desc: "Lets Vision read posture, blink rate, and expression. Frames never leave your device.",
    icon: Camera,
  },
  {
    key: "microphone",
    label: "Microphone access",
    desc: "Used only during a 30-second Voice call. Nothing is recorded.",
    icon: Mic,
  },
  {
    key: "aiMonitoring",
    label: "AI monitoring",
    desc: "Anchor watches your signals and quietly nudges you when something drifts.",
    icon: Cpu,
  },
  {
    key: "parentAccess",
    label: "Parent monitoring",
    desc: "Share your weekly study, focus, and wellness summary with a parent or guardian.",
    icon: Users,
  },
  {
    key: "notifications",
    label: "Notifications",
    desc: "Anchor whispers, never shouts. You can disable spoken nudges here.",
    icon: Bell,
  },
  {
    key: "focusOnLaunch",
    label: "Auto-start Focus Mode",
    desc: "Launch the app straight into a 25-minute focus block.",
    icon: Focus,
  },
];

export default function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setS({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(s));
    } catch {}
  }, [s]);

  const toggle = (k: keyof Settings) => setS((x) => ({ ...x, [k]: !x[k] }));

  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ settings: s, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anchor-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Settings."
        subtitle="You control what Anchor sees, hears, and shares. Every switch is opt-in."
      />

      <Card className="mb-6 flex items-start gap-3 border-cyan-400/20 bg-cyan-400/5 p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
        <div className="text-cyan-100/90">
          Anchor is off by default. Nothing turns on until you flip a switch —
          and every switch can be turned back off.
        </div>
      </Card>

      <div className="grid gap-3">
        {items.map((it) => (
          <Card
            key={it.key}
            className="flex items-center justify-between bg-neutral-950/60 p-4"
          >
            <div className="flex items-start gap-4">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 ring-1 ring-cyan-400/20">
                <it.icon className="h-4 w-4 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-100">
                  {it.label}
                </h3>
                <p className="mt-0.5 max-w-lg text-xs text-neutral-500">
                  {it.desc}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggle(it.key)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                s[it.key] ? "bg-cyan-400" : "bg-neutral-800"
              )}
              aria-label={`Toggle ${it.label}`}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  s[it.key] ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </Card>
        ))}
      </div>

      <Card className="mt-6 flex items-center justify-between bg-neutral-950/60 p-4">
        <div>
          <h3 className="text-sm font-medium text-neutral-100">Data export</h3>
          <p className="mt-0.5 text-xs text-neutral-500">
            Download every setting and stored preference as JSON.
          </p>
        </div>
        <button
          onClick={exportData}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-xs text-neutral-300 hover:border-cyan-400/40 hover:text-cyan-200"
        >
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </Card>
    </div>
  );
}
