"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader, StatTile } from "@/components/page-header";
import { useSignals } from "@/components/signals-store";
import { assignments, parentWeekly } from "@/lib/mock-data";
import { CalendarDays, FileText, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "daily" | "weekly";

export default function ReportsPage() {
  const { state, metrics } = useSignals();
  const [kind, setKind] = useState<Kind>("daily");
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setReport(null);
    const doneCount = assignments.filter((a) => a.status === "done").length;
    const totalCount = assignments.length;
    const distractions = state.distractions.length;
    const historyAvgWellness = state.history.length
      ? Math.round(state.history.reduce((s, x) => s + x.wellness, 0) / state.history.length)
      : Math.round(metrics.wellness);
    const context =
      kind === "daily"
        ? `Daily snapshot. Wellness avg ${historyAvgWellness}. Focus ${Math.round(metrics.focus)}. Stress ${Math.round(metrics.stress)}. ${distractions} distraction attempts today. Assignments done ${doneCount}/${totalCount}.`
        : `Weekly view. Study hours ${parentWeekly.studyHours.reduce((s, x) => s + x, 0).toFixed(1)}. Focus hours ${parentWeekly.focusHours.reduce((s, x) => s + x, 0).toFixed(1)}. Assignments ${parentWeekly.assignmentsDone}/${parentWeekly.assignmentsTotal}. Wellness trend ${parentWeekly.wellness.join(",")}.`;

    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are Anchor. Write a short, warm report in 3 short paragraphs — What went well, what to watch, one concrete next step. No lists, no emojis. Max 90 words.",
            },
            { role: "user", content: context },
          ],
        }),
      });
      const data = await res.json();
      setReport(data?.reply ?? "Couldn't generate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Reports."
        subtitle="Warm, quiet summaries of your day or week — generated on demand."
        actions={
          <div className="flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-950/60 p-1">
            {(["daily", "weekly"] as Kind[]).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs",
                  kind === k
                    ? "bg-cyan-400/20 text-cyan-100"
                    : "text-neutral-400 hover:text-neutral-100"
                )}
              >
                {k}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <StatTile
          label={kind === "daily" ? "Today's wellness" : "Weekly avg"}
          value={
            kind === "daily"
              ? Math.round(metrics.wellness)
              : Math.round(
                  parentWeekly.wellness.reduce((s, x) => s + x, 0) /
                    parentWeekly.wellness.length
                )
          }
          hint={kind === "daily" ? "right now" : "last 7 days"}
          accent="cyan"
        />
        <StatTile
          label="Focus"
          value={Math.round(metrics.focus)}
          hint="composite"
          accent="emerald"
        />
        <StatTile
          label="Assignments done"
          value={`${assignments.filter((a) => a.status === "done").length}/${assignments.length}`}
          accent="violet"
        />
        <StatTile
          label="Distractions"
          value={state.distractions.length}
          hint="counted this session"
          accent="rose"
        />
      </div>

      <Card className="bg-neutral-950/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {kind === "daily" ? (
              <FileText className="h-4 w-4 text-cyan-300" />
            ) : (
              <CalendarDays className="h-4 w-4 text-cyan-300" />
            )}
            <h3 className="text-sm font-medium text-neutral-100">
              {kind === "daily" ? "Today" : "This week"}
            </h3>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-medium text-neutral-950 hover:scale-[1.02] transition-transform disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {loading ? "Writing" : "Generate"}
          </button>
        </div>
        {report ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-200">
            {report}
          </div>
        ) : (
          <div className="text-xs text-neutral-500">
            Tap Generate to have Anchor write a {kind} summary from your
            signals, assignments, and history.
          </div>
        )}
      </Card>
    </div>
  );
}
