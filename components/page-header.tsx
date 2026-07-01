import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, className, actions }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex items-end justify-between gap-6", className)}>
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-100 md:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-xl text-sm text-neutral-400">{subtitle}</p>
        )}
      </div>
      {actions}
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "cyan" | "emerald" | "violet" | "rose";
  className?: string;
}

export function StatTile({ label, value, hint, accent = "cyan", className }: StatTileProps) {
  const glow =
    accent === "cyan"
      ? "hsl(188 90% 55% / 0.25)"
      : accent === "emerald"
      ? "hsl(160 80% 55% / 0.22)"
      : accent === "violet"
      ? "hsl(265 80% 65% / 0.22)"
      : "hsl(350 80% 60% / 0.22)";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-neutral-900 bg-neutral-950/60 p-4",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
        style={{ background: glow }}
      />
      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-100">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
