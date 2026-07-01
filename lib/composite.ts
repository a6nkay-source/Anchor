// Composite scores that combine live signals + history + academic data
// into single numbers we present to the student.

import { gpa, courses, assignments } from "@/lib/mock-data";
import { last30Days, avg } from "@/lib/history";
import type { DerivedMetrics } from "@/components/signals-store";

export interface AcademicWellnessBreakdown {
  overall: number;
  grades: number;
  focus: number;
  stress: number; // low stress = high score
  recovery: number;
  productivity: number;
  habits: number;
}

// Blend GPA (0-4) into a 0-100, live focus/stress/energy from derived
// metrics, and 7-day averages from history to smooth today's read.
export function academicWellness(metrics: DerivedMetrics): AcademicWellnessBreakdown {
  const week = last30Days().slice(-7);
  const wRecovery = avg(week.map((d) => d.recovery));
  const wProductivity = avg(week.map((d) => d.productivity));
  const wStudyHours = avg(week.map((d) => d.studyHours));

  const grades = Math.round((gpa.current / 4.0) * 100);
  const focus = Math.round(metrics.focus);
  const stressInverted = Math.round(100 - metrics.stress);
  const recovery = Math.round(wRecovery);
  const productivity = Math.round(wProductivity);
  // habits: proximity to a healthy ~3h/day study rhythm
  const habits = Math.round(Math.max(0, 100 - Math.abs(wStudyHours - 3) * 22));

  const overall = Math.round(
    grades * 0.22 +
      focus * 0.16 +
      stressInverted * 0.14 +
      recovery * 0.18 +
      productivity * 0.16 +
      habits * 0.14
  );

  return { overall, grades, focus, stress: stressInverted, recovery, productivity, habits };
}

export interface ReadinessBreakdown {
  score: number;
  sleep: number;
  stress: number;
  workload: number;
  typing: number;
  posture: number;
  focus: number;
  label: string;
}

export function learningReadiness(
  metrics: DerivedMetrics,
  vision: { active: boolean; postureScore: number },
  typing: { active: boolean; hesitationScore: number }
): ReadinessBreakdown {
  const week = last30Days().slice(-7);
  const sleep = Math.round(Math.min(100, (avg(week.map((d) => d.sleepHours)) / 8) * 100));
  const stress = Math.round(100 - metrics.stress);
  const workload = Math.round(Math.max(0, 100 - avg(week.map((d) => d.workloadHours)) * 10));
  const typingScore = typing.active ? Math.round(typing.hesitationScore) : 70;
  const posture = vision.active ? Math.round(vision.postureScore) : 70;
  const focus = Math.round(metrics.focus);

  const score = Math.round(
    sleep * 0.22 +
      stress * 0.2 +
      workload * 0.14 +
      typingScore * 0.12 +
      posture * 0.12 +
      focus * 0.2
  );

  const label =
    score >= 82 ? "primed" : score >= 65 ? "ready" : score >= 50 ? "warming up" : "hold off";

  return { score, sleep, stress, workload, typing: typingScore, posture, focus, label };
}

export interface BurnoutForecast {
  today: number;
  in7d: number;
  in14d: number;
  drivers: { label: string; contribution: number }[];
}

// Very simple "forecast": extrapolate the recent slope of history + weigh
// upcoming workload from open assignments.
export function burnoutForecast(): BurnoutForecast {
  const days = last30Days();
  const recent = days.slice(-14);
  const half = Math.floor(recent.length / 2);
  const a = avg(recent.slice(0, half).map((d) => d.burnoutRisk));
  const b = avg(recent.slice(-half).map((d) => d.burnoutRisk));
  const slopePerDay = (b - a) / half;

  const openAssignments = assignments.filter((x) => x.status !== "done");
  const upcomingHours = openAssignments.reduce((s, x) => s + x.estMinutes / 60, 0);
  const upcomingWeight = Math.min(15, upcomingHours * 0.6);

  const today = Math.max(0, Math.min(100, Math.round(b)));
  const in7d = Math.max(0, Math.min(100, Math.round(today + slopePerDay * 7 + upcomingWeight * 0.5)));
  const in14d = Math.max(0, Math.min(100, Math.round(today + slopePerDay * 14 + upcomingWeight)));

  const drivers = [
    { label: "Recent stress trend", contribution: Math.round(Math.max(0, slopePerDay) * 12) },
    { label: "Upcoming workload", contribution: Math.round(upcomingWeight * 5) },
    { label: "Sleep deficit", contribution: Math.round(Math.max(0, 7.5 - avg(recent.map((d) => d.sleepHours))) * 25) },
    { label: "Break shortage", contribution: Math.round(Math.max(0, 20 - avg(recent.map((d) => d.breakMinutes / 5))) * 2) },
  ].sort((x, y) => y.contribution - x.contribution);

  return { today, in7d, in14d, drivers };
}
