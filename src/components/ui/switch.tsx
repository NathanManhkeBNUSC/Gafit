"use client";
import { cn } from "./cn";

/** On/off setting row control. The label is the row text; this is the 52×32 track. */
export function Switch({ checked, onChange, label, className }: { checked: boolean; onChange: (v: boolean) => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full transition-colors duration-200",
        checked ? "bg-rose" : "bg-surface-3",
        className,
      )}
    >
      <span
        className={cn(
          "absolute left-1 size-6 rounded-full shadow-1 transition-transform duration-200 ease-[var(--ease-out)]",
          checked ? "translate-x-5 bg-rose-ink" : "bg-text-2",
        )}
      />
    </button>
  );
}
