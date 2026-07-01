"use client";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { HealthTile } from "@/components/health-tile";
import { TrendSpark } from "@/components/trend-spark";
import { AIRecommendation } from "@/components/ai-recommendation";
import { useSignals } from "@/components/signals-store";
import { academicWellness } from "@/lib/composite";
import { last30Days, trend } from "@/lib/history";

export default function IndexPage() {
  const { metrics } = useSignals();
  const b = academicWellness(metrics);
  const history = last30Days();
  const wellnessTrend = trend(history.slice(-14).map((d) => d.wellness));

  const context = `Academic Wellness Index ${b.overall}/100. Grades ${b.grades}, focus ${b.focus}, stress-inverse ${b.stress}, recovery ${b.recovery}, productivity ${b.productivity}, habits ${b.habits}. 14-day wellness trend ${wellnessTrend.pct >= 0 ? "+" : ""}${wellnessTrend.pct}%.`;

  return (
    <div>
      <PageHeader
        eyebrow="Academic Wellness"
        title="One number for how you're doing."
        subtitle="Combines your grades, live focus and stress, recovery, productivity, and study habits."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card className="relative overflow-hidden bg-gradient-to-br from-neutral-950 to-neutral-900 p-8">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
            style={{ background: "hsl(188 90% 55% / 0.25)" }}
          />
          <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/70">
            Academic Wellness Index
          </p>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-7xl font-semibold tabular-nums text-neutral-100">{b.overall}</span>
            <span className="text-sm text-neutral-500">/100</span>
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            {wellnessTrend.dir === "up"
              ? `+${wellnessTrend.pct}% over the last two weeks`
              : wellnessTrend.dir === "down"
              ? `${wellnessTrend.pct}% over the last two weeks`
              : "steady over the last two weeks"}
          </div>
          <div className="mt-6">
            <TrendSpark values={history.map((d) => d.wellness)} color="#67e8f9" />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <HealthTile label="Grades" value={b.grades} arc={b.grades} accent="cyan" hint={`GPA-derived`} />
          <HealthTile label="Focus" value={b.focus} arc={b.focus} accent="emerald" hint="live" />
          <HealthTile label="Low stress" value={b.stress} arc={b.stress} accent="rose" hint="100 = calm" />
          <HealthTile label="Recovery" value={b.recovery} arc={b.recovery} accent="violet" hint="7-day avg" />
          <HealthTile label="Productivity" value={b.productivity} arc={b.productivity} accent="emerald" hint="7-day avg" />
          <HealthTile label="Habits" value={b.habits} arc={b.habits} accent="cyan" hint="rhythm proximity" />
        </div>
      </div>

      <div className="mt-6">
        <AIRecommendation
          systemPrompt="You are Anchor. In 3 short sentences, warmly explain what the Academic Wellness Index number means today and one concrete lever the student can pull this week. No lists, no emojis."
          context={context}
          title="What today's number means"
        />
      </div>
    </div>
  );
}
