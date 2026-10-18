"use client";
import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "soft" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold select-none whitespace-nowrap transition-[background-color,color,box-shadow,transform,opacity] duration-150 active:scale-[0.97] disabled:opacity-45 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-rose text-rose-ink shadow-rose hover:bg-rose-strong",
  secondary: "bg-surface-2 text-text hover:bg-surface-3",
  soft: "bg-rose-soft text-rose hover:bg-rose-soft/70",
  ghost: "text-text-2 hover:bg-surface-2 hover:text-text",
  outline: "border border-line-strong text-text hover:bg-surface-2",
  danger: "bg-danger-soft text-danger hover:bg-danger/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-full",
  md: "h-12 px-5 text-base rounded-full",
  lg: "h-14 px-6 text-lg rounded-full",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  block?: boolean;
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, icon, block, href, className, children, disabled, ...rest },
  ref,
) {
  const cls = cn(base, variants[variant], sizes[size], block && "w-full", className);
  const content = (
    <>
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
});

export function IconButton({
  label,
  className,
  variant = "ghost",
  size = "md",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: "ghost" | "secondary" | "primary" | "soft"; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-150 active:scale-[0.94] disabled:opacity-40",
        size === "md" ? "size-11" : "size-9",
        variant === "ghost" && "text-text-2 hover:bg-surface-2 hover:text-text",
        variant === "secondary" && "bg-surface-2 text-text hover:bg-surface-3",
        variant === "primary" && "bg-rose text-rose-ink hover:bg-rose-strong",
        variant === "soft" && "bg-rose-soft text-rose",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
