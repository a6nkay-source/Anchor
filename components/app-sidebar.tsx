"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Camera,
  Keyboard,
  Mic,
  Activity,
  BookOpen,
  ClipboardList,
  CalendarDays,
  FileText,
  Layers,
  GraduationCap,
  MessageSquare,
  Focus,
  Users,
  Settings,
  Anchor as AnchorIcon,
  Play,
  Square,
  HeartPulse,
  Sparkles,
  Network,
  BookMarked,
  ListTodo,
  Rewind,
  Trophy,
  FileBarChart,
  Music,
  AlertCircle,
  Award,
  Gauge,
  Zap,
  TrendingUp,
  Waves,
  Target,
  Moon,
  Armchair,
  Timer,
  LineChart,
  Heart,
  Bluetooth,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignals } from "@/components/signals-store";
import { useFocus } from "@/components/focus-mode";
import { useMonitor } from "@/components/wellness-monitor";

const groups: { label: string; items: { href: string; label: string; icon: any; exact?: boolean }[] }[] = [
  {
    label: "Home",
    items: [
      { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/app/index-score", label: "Wellness Index", icon: Gauge },
      { href: "/app/readiness", label: "Readiness", icon: Zap },
      { href: "/app/coach", label: "AI Coach", icon: Sparkles },
    ],
  },
  {
    label: "Live signals",
    items: [
      { href: "/app/vision", label: "Vision", icon: Camera },
      { href: "/app/typing", label: "Typing", icon: Keyboard },
      { href: "/app/voice", label: "Voice", icon: Mic },
      { href: "/app/signals", label: "Signals log", icon: Activity },
      { href: "/app/events", label: "Wellness events", icon: AlertCircle },
      { href: "/app/achievements", label: "Achievements", icon: Award },
    ],
  },
  {
    label: "Health",
    items: [
      { href: "/app/health", label: "Health Dashboard", icon: HeartPulse },
      { href: "/app/biomarkers", label: "Digital biomarkers", icon: Waves },
      { href: "/app/burnout", label: "Burnout forecast", icon: TrendingUp },
      { href: "/app/recovery", label: "Sleep & recovery", icon: Moon },
      { href: "/app/ergonomics", label: "Ergonomics", icon: Armchair },
      { href: "/app/checkin", label: "Check-in", icon: Heart },
      { href: "/app/timeline", label: "Health timeline", icon: LineChart },
      { href: "/app/integrations", label: "Wearables", icon: Bluetooth },
    ],
  },
  {
    label: "Study",
    items: [
      { href: "/app/courses", label: "Courses", icon: BookOpen },
      { href: "/app/graderoom", label: "GradeRoom", icon: Trophy },
      { href: "/app/assignments", label: "Assignments", icon: ClipboardList },
      { href: "/app/mastery", label: "Concept mastery", icon: Target },
      { href: "/app/prescription", label: "Study Prescription", icon: Sparkles },
      { href: "/app/planner", label: "Planner", icon: ListTodo },
      { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/app/notes", label: "Notes", icon: FileText },
      { href: "/app/reader", label: "PDF Reader", icon: BookMarked },
      { href: "/app/flashcards", label: "Flashcards", icon: Layers },
      { href: "/app/graph", label: "Knowledge graph", icon: Network },
      { href: "/app/tutor", label: "AI Tutor", icon: GraduationCap },
    ],
  },
  {
    label: "Community",
    items: [{ href: "/app/messages", label: "Messages", icon: MessageSquare }],
  },
  {
    label: "System",
    items: [
      { href: "/app/focus", label: "Focus Room", icon: Focus },
      { href: "/app/adaptive", label: "Adaptive focus", icon: Timer },
      { href: "/app/replay", label: "Session replay", icon: Rewind },
      { href: "/app/reports", label: "Reports", icon: FileBarChart },
      { href: "/app/parent", label: "Parent view", icon: Users },
      { href: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { wellnessScore, wellnessLabel, state } = useSignals();
  const { active: focusActive, remainingSec, start, stop } = useFocus();
  const { phase: camPhase } = useMonitor();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col justify-between border-r border-neutral-900 bg-black/40 p-4 backdrop-blur">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 px-2 text-neutral-100"
        >
          <AnchorIcon className="h-4 w-4 text-cyan-300" />
          <span className="text-sm font-semibold tracking-wide">Anchor</span>
        </Link>

        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <p className="mb-1 px-2 text-[10px] uppercase tracking-[0.18em] text-neutral-600">
              {g.label}
            </p>
            <nav className="flex flex-col gap-0.5">
              {g.items.map((t) => {
                const active = t.exact
                  ? pathname === t.href
                  : pathname?.startsWith(t.href);
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-cyan-400/10 text-cyan-100"
                        : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                    <span className="truncate">{t.label}</span>
                    {t.label === "Vision" && camPhase === "running" && (
                      <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    )}
                    {t.label === "Typing" && state.typing.active && (
                      <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              Focus Mode
            </span>
            {focusActive ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                on
              </span>
            ) : (
              <span className="text-[10px] text-neutral-500">off</span>
            )}
          </div>
          {focusActive ? (
            <div className="flex items-center justify-between">
              <span className="tabular-nums text-lg text-neutral-100">
                {String(Math.floor(remainingSec / 60)).padStart(2, "0")}:
                {String(remainingSec % 60).padStart(2, "0")}
              </span>
              <button
                onClick={() => stop()}
                className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-1 text-[11px] text-rose-200 hover:border-rose-400/60"
              >
                <Square className="h-3 w-3" /> Exit
              </button>
            </div>
          ) : (
            <button
              onClick={() => start(25)}
              className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-cyan-400 px-2 py-1 text-[11px] font-medium text-neutral-950 hover:scale-[1.02] transition-transform"
            >
              <Play className="h-3 w-3" /> Start 25 min
            </button>
          )}
        </div>

        <div className="rounded-xl border border-neutral-900 bg-neutral-950/60 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Live wellness
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-neutral-100">
              {wellnessScore}
            </span>
            <span className="text-xs text-cyan-300/80">{wellnessLabel}</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-neutral-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-[width] duration-700"
              style={{ width: `${wellnessScore}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
