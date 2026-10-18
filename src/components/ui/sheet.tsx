"use client";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "./cn";

/**
 * Bottom sheet built on <dialog> (focus trap, Esc, backdrop for free).
 * On wide screens it centers as a dialog.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  tall,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  tall?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 mt-auto w-full max-w-none bg-transparent p-0 text-text backdrop:backdrop-blur-[2px] sm:m-auto sm:max-w-lg",
        "open:flex open:flex-col",
      )}
    >
      {open && (
        <div
          className={cn(
            "anim-sheet flex max-h-[92dvh] flex-col rounded-t-xl bg-bg-elev shadow-2 sm:rounded-xl",
            tall && "h-[92dvh] sm:h-[80dvh]",
            className,
          )}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
          {title !== undefined && (
            <div className="flex items-center gap-3 px-5 pb-2 pt-3">
              <h2 className="min-w-0 flex-1 truncate text-xl font-bold">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Fechar" className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-text-2 hover:text-text">
                <X className="size-5" />
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
          {footer && <div className="safe-bottom border-t border-line px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmSheet({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  onConfirm,
  danger,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="text-text-2">{message}</p>
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "h-12 rounded-full font-semibold transition-colors disabled:opacity-50",
            danger ? "bg-danger text-danger-ink hover:opacity-90" : "bg-rose text-rose-ink hover:bg-rose-strong",
          )}
        >
          {confirmLabel}
        </button>
        <button type="button" onClick={onClose} className="h-12 rounded-full font-semibold text-text-2 hover:bg-surface-2">
          Cancelar
        </button>
      </div>
    </Sheet>
  );
}
