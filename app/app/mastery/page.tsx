"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { AIRecommendation } from "@/components/ai-recommendation";
import { courses } from "@/lib/mock-data";
import { allConcepts, conceptsFor, type Concept } from "@/lib/mastery";
import { cn } from "@/lib/utils";
import { CheckCircle2, TrendingUp, AlertCircle, Clock } from "lucide-react";

export default function MasteryPage() {
  const [activeCourse, setActiveCourse] = useState<string>(courses[0].id);
  const concepts = conceptsFor(activeCourse);

  const counts = useMemo(() => {
    const c: Record<Concept["status"], number> = { mastered: 0, improving: 0, weak: 0 };
    for (const x of concepts) c[x.status] += 1;
    return c;
  }, [concepts]);

  const total = concepts.length;
  const mPct = total ? Math.round((counts.mastered / total) * 100) : 0;

  const course = courses.find((c) => c.id === activeCourse)!;

  return (
    <div>
      <PageHeader
        eyebrow="Study"
        title="Concept mastery."
        subtitle="Every concept you're learning, ranked by how solid it is right now."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCourse(c.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              activeCourse === c.id
                ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100"
                : "border-neutral-800 text-neutral-400 hover:border-neutral-600"
            )}
            style={activeCourse === c.id ? undefined : { borderColor: `${c.color}22` }}
          >
            {c.code}
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <StatCard label="Overall mastery" value={`${mPct}%`} hint={`${counts.mastered}/${total} solid`} color={course.color} />
        <StatCard label="Mastered" value={counts.mastered} hint="≥ 80" color="#86efac" icon={CheckCircle2} />
        <StatCard label="Improving" value={counts.improving} hint="55–79" color="#67e8f9" icon={TrendingUp} />
        <StatCard label="Weak spots" value={counts.weak} hint="< 55" color="#fda4af" icon={AlertCircle} />
      </div>

      <div className="space-y-2">
        {(["weak", "improving", "mastered"] as Concept["status"][]).map((status) => (
          <div key={status}>
            <p className="mb-2 mt-4 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              {status === "weak" ? "Weak — practice these" : status === "improving" ? "Improving" : "Mastered"}
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {concepts.filter((c) => c.status === status).map((c) => (
                <Card key={c.id} className="flex items-center justify-between bg-neutral-950/60 p-4">
                  <div className="min-w-0">
                    <div className="text-sm text-neutral-100">{c.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500">
                      <Clock className="h-3 w-3" />
                      last practiced {new Date(c.lastPracticed).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end">
                    <div className="text-lg font-semibold tabular-nums text-neutral-100">{c.mastery}</div>
                    <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-neutral-900">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${c.mastery}%`,
                          background: status === "weak" ? "#fda4af" : status === "improving" ? "#67e8f9" : "#86efac",
                        }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-neutral-500">
                      recommend {c.recommendedMinutes}m
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <AIRecommendation
          systemPrompt="You are Anchor's tutor. In 3 short sentences, tell the student the single weakest concept to fix first and how to fix it (active recall + one small exercise). No lists."
          context={`Course ${course.code} (${course.title}). Weak concepts: ${concepts.filter((c) => c.status === "weak").map((c) => c.name).join(", ") || "none"}. Improving: ${concepts.filter((c) => c.status === "improving").map((c) => c.name).join(", ")}.`}
          title="Which concept to fix first"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  color: string;
  icon?: any;
}) {
  return (
    <Card className="relative overflow-hidden bg-neutral-950/60 p-4">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
        style={{ background: `${color}22` }}
      />
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5" style={{ color }} />}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">{value}</div>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </Card>
  );
}
