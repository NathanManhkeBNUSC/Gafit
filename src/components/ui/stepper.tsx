"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "./cn";

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  format = (v: number) => String(v),
  label,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  label: string;
  className?: string;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v / step) * step)));
  return (
    <div className={cn("flex h-12 items-center rounded-full bg-surface-2", className)} role="group" aria-label={label}>
      <button type="button" className="flex size-12 items-center justify-center rounded-full text-text-2 hover:text-text disabled:opacity-30" onClick={() => set(value - step)} disabled={value <= min} aria-label={`Diminuir ${label}`}>
        <Minus className="size-4" />
      </button>
      <span className="tabular min-w-12 flex-1 text-center font-semibold" aria-live="polite">
        {format(value)}
      </span>
      <button type="button" className="flex size-12 items-center justify-center rounded-full text-text-2 hover:text-text disabled:opacity-30" onClick={() => set(value + step)} disabled={value >= max} aria-label={`Aumentar ${label}`}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}
