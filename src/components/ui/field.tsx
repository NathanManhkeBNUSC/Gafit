"use client";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

const control =
  "w-full rounded-sm border border-line bg-surface-2 px-4 text-base text-text transition-colors duration-150 hover:border-line-strong focus:border-rose focus:outline-none aria-[invalid=true]:border-danger";

interface FieldWrapProps {
  label?: string;
  hint?: ReactNode;
  error?: string | null;
  children: (id: string, describedBy?: string) => ReactNode;
  className?: string;
}

export function FieldWrap({ label, hint, error, children, className }: FieldWrapProps) {
  const id = useId();
  const descId = hint || error ? `${id}-d` : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="px-1 text-sm font-semibold text-text-2">
          {label}
        </label>
      )}
      {children(id, descId)}
      {(error || hint) && (
        <p id={descId} className={cn("px-1 text-xs", error ? "text-danger" : "text-text-3")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: ReactNode; error?: string | null; suffix?: string };

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, suffix, className, ...rest }, ref) {
  return (
    <FieldWrap label={label} hint={hint} error={error} className={className}>
      {(id, d) => (
        <div className="relative">
          <input
            ref={ref}
            id={id}
            aria-describedby={d}
            aria-invalid={error ? true : undefined}
            className={cn(control, "h-12", suffix && "pr-12")}
            {...rest}
          />
          {suffix && <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-text-3">{suffix}</span>}
        </div>
      )}
    </FieldWrap>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: ReactNode; error?: string | null };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, hint, error, className, ...rest }, ref) {
  return (
    <FieldWrap label={label} hint={hint} error={error} className={className}>
      {(id, d) => (
        <textarea
          ref={ref}
          id={id}
          aria-describedby={d}
          aria-invalid={error ? true : undefined}
          className={cn(control, "min-h-28 py-3 leading-relaxed")}
          {...rest}
        />
      )}
    </FieldWrap>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; hint?: ReactNode; error?: string | null };

export function Select({ label, hint, error, className, children, ...rest }: SelectProps) {
  return (
    <FieldWrap label={label} hint={hint} error={error} className={className}>
      {(id, d) => (
        <select id={id} aria-describedby={d} className={cn(control, "h-12 appearance-none bg-[length:16px] pr-10")} {...rest}>
          {children}
        </select>
      )}
    </FieldWrap>
  );
}
