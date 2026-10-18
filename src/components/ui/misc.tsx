import type { ReactNode } from "react";
import { cn } from "./cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} aria-hidden />;
}

export function EmptyState({ icon, title, children, action, className }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center rounded-lg border border-dashed border-line-strong px-6 py-10 text-center", className)}>
      {icon && <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-rose-soft text-rose">{icon}</div>}
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <div className="mt-1.5 max-w-sm text-sm text-text-2">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Colored letter for a plan day (A, B, C...). Color follows the day position. */
export function DayBadge({ index, label, size = "md", className }: { index: number; label?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const color = `var(--day-${(index % 6) + 1})`;
  const text = label ?? String.fromCharCode(65 + index);
  return (
    <span
      className={cn(
        "font-display inline-flex shrink-0 items-center justify-center rounded-full font-extrabold",
        size === "sm" && "size-7 text-sm",
        size === "md" && "size-10 text-lg",
        size === "lg" && "size-14 text-2xl",
        className,
      )}
      style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
      aria-hidden
    >
      {text}
    </span>
  );
}

export function dayLetter(name: string, index: number) {
  const m = name.match(/\b([A-Z])$/) ?? name.match(/^(?:Treino|Dia|Ficha)\s+([A-Z0-9]{1,2})\b/i);
  if (m) return m[1].toUpperCase();
  return name.trim()[0]?.toUpperCase() ?? String.fromCharCode(65 + index);
}

export function Stat({ value, label, className }: { value: ReactNode; label: string; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="font-display tabular truncate text-2xl font-bold">{value}</div>
      <div className="truncate text-xs text-text-3">{label}</div>
    </div>
  );
}
