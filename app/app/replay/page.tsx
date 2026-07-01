"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useSignals } from "@/components/signals-store";
import { Rewind } from "lucide-react";

export default function ReplayPage() {
  const { state } = useSignals();
  const history = state.history;
  const distractions = state.distractions;

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Session replay."
        subtitle="A quiet scrub through what your last block actually looked like."
      />

      {history.length === 0 ? (
        <Card className="p-10 text-center text-sm text-neutral-500">
          <Rewind className="mx-auto mb-3 h-6 w-6 text-neutral-600" />
          No session data yet. Start a Focus block, or turn on Vision/Typing —
          Anchor snapshots every 15 seconds.
        </Card>
      ) : (
        <>
          <SeriesCard
            title="Wellness"
            values={history.map((h) => h.wellness)}
            color="#a78bfa"
          />
          <SeriesCard
            title="Focus"
            values={history.map((h) => h.focus)}
            color="#67e8f9"
          />
          <SeriesCard
            title="Stress"
            values={history.map((h) => h.stress)}
            color="#fda4af"
          />
          <SeriesCard
            title="Posture"
            values={history.map((h) => h.posture)}
            color="#86efac"
          />

          <Card className="mt-6 bg-neutral-950/60 p-4">
            <h3 className="mb-3 text-sm font-medium text-neutral-100">
              Distraction timeline
            </h3>
            {distractions.length === 0 ? (
              <div className="text-xs text-neutral-500">
                Nothing pulled you away. Nice block.
              </div>
            ) : (
              <ul className="space-y-1">
                {distractions.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between border-b border-neutral-900 py-1 text-xs"
                  >
                    <span className="text-neutral-300">
                      {labelFor(d.kind)}{" "}
                      {d.detail && (
                        <span className="text-neutral-500">· {d.detail}</span>
                      )}
                    </span>
                    <span className="tabular-nums text-neutral-500">
                      {new Date(d.ts).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function labelFor(k: string) {
  switch (k) {
    case "tab-hidden":
      return "Tab hidden";
    case "fullscreen-exit":
      return "Exited fullscreen";
    case "blocked-click":
      return "Clicked blocked link";
    case "app-blur":
      return "Switched apps";
    default:
      return k;
  }
}

function SeriesCard({
  title,
  values,
  color,
}: {
  title: string;
  values: number[];
  color: string;
}) {
  if (values.length === 0) return null;
  const w = 640;
  const h = 80;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * (w - 10) + 5;
      const y = h - (v / 100) * (h - 10) - 5;
      return `${x},${y}`;
    })
    .join(" ");
  const last = values[values.length - 1];
  return (
    <Card className="mb-3 bg-neutral-950/60 p-4">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-neutral-200">{title}</span>
        <span className="tabular-nums text-neutral-500">
          {Math.round(last)}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Card>
  );
}
