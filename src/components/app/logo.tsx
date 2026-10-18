import { cn } from "@/components/ui/cn";

/** Wordmark: a rose plate-and-bar glyph next to the name set in the display face. */
export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 40 40" className="size-10" aria-hidden>
        <rect width="40" height="40" rx="12" fill="var(--rose)" />
        <rect x="7" y="13" width="5" height="14" rx="2.5" fill="var(--rose-ink)" />
        <rect x="28" y="13" width="5" height="14" rx="2.5" fill="var(--rose-ink)" />
        <rect x="12" y="18.5" width="16" height="3" rx="1.5" fill="var(--rose-ink)" />
      </svg>
      <span className="font-display text-2xl font-extrabold tracking-tight">Gafit</span>
    </div>
  );
}
