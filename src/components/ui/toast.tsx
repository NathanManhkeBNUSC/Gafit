"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "./cn";

type Tone = "default" | "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
  action?: { label: string; onClick: () => void };
}

const Ctx = createContext<(m: string, o?: { tone?: Tone; action?: ToastItem["action"] }) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((message: string, o?: { tone?: Tone; action?: ToastItem["action"] }) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-2), { id, message, tone: o?.tone ?? "default", action: o?.action }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), o?.action ? 6000 : 3500);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))]" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "anim-rise pointer-events-auto flex max-w-md items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold shadow-2",
              t.tone === "error" ? "bg-danger text-danger-ink" : t.tone === "success" ? "bg-mint text-mint-ink" : "bg-surface-3 text-text",
            )}
          >
            <span>{t.message}</span>
            {t.action && (
              <button type="button" className="underline underline-offset-2" onClick={t.action.onClick}>
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
