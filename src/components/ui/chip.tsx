"use client";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export function Chip({ active, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors duration-150",
        active ? "border-transparent bg-rose text-rose-ink" : "border-line bg-surface text-text-2 hover:border-line-strong hover:text-text",
        className,
      )}
      {...rest}
    />
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex rounded-full bg-surface-2 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-9 flex-1 rounded-full px-3 text-sm font-semibold transition-colors duration-150",
            value === o.value ? "bg-surface text-text shadow-1" : "text-text-3 hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Badge({ tone = "neutral", className, ...rest }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "rose" | "lilac" | "mint" | "peach" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-bold",
        tone === "neutral" && "bg-surface-2 text-text-2",
        tone === "rose" && "bg-rose-soft text-rose",
        tone === "lilac" && "bg-lilac-soft text-lilac",
        tone === "mint" && "bg-mint-soft text-mint",
        tone === "peach" && "bg-peach-soft text-peach",
        tone === "danger" && "bg-danger-soft text-danger",
        className,
      )}
      {...rest}
    />
  );
}
