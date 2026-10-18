"use client";
import { Minus, Plus, SkipForward } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatClock } from "@/lib/training";

const KEY = "gafit-rest";

interface RestState {
  endAt: number;
  total: number;
  label: string;
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.22, 0.44].forEach((t, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = i === 2 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.18);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.2);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {}
}

/** Rest countdown that survives reloads (end time kept in localStorage). */
export function useRestTimer(opts: { sound: boolean }) {
  const [rest, setRest] = useState<RestState | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(KEY);
      const r = raw ? (JSON.parse(raw) as RestState) : null;
      return r && r.endAt > Date.now() ? r : null;
    } catch {
      return null;
    }
  });
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);

  useEffect(() => {
    if (!rest) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [rest]);

  const remaining = rest ? Math.max(0, (rest.endAt - now) / 1000) : 0;

  useEffect(() => {
    if (!rest) return;
    if (remaining <= 0 && !fired.current) {
      fired.current = true;
      if (opts.sound) beep();
      navigator.vibrate?.([200, 100, 200]);
      const t = setTimeout(() => {
        setRest(null);
        localStorage.removeItem(KEY);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [remaining, rest, opts.sound]);

  const start = useCallback((seconds: number, label: string) => {
    if (seconds <= 0) return;
    const r = { endAt: Date.now() + seconds * 1000, total: seconds, label };
    fired.current = false;
    setNow(Date.now());
    setRest(r);
    try {
      localStorage.setItem(KEY, JSON.stringify(r));
    } catch {}
  }, []);

  const adjust = useCallback((delta: number) => {
    setRest((r) => {
      if (!r) return r;
      const n = { ...r, endAt: Math.max(Date.now() + 1000, r.endAt + delta * 1000), total: Math.max(5, r.total + delta) };
      try {
        localStorage.setItem(KEY, JSON.stringify(n));
      } catch {}
      fired.current = false;
      return n;
    });
  }, []);

  const stop = useCallback(() => {
    setRest(null);
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }, []);

  return { rest, remaining, start, adjust, stop };
}

export function RestBar({ rest, remaining, onAdjust, onSkip }: { rest: RestState; remaining: number; onAdjust: (d: number) => void; onSkip: () => void }) {
  const done = remaining <= 0;
  const pct = Math.min(100, Math.max(0, (1 - remaining / rest.total) * 100));
  return (
    <div className="anim-rise fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))]" role="timer" aria-live="off">
      <div className="relative mx-auto max-w-xl overflow-hidden rounded-xl bg-surface-3 shadow-2">
        <div className="absolute inset-y-0 left-0 bg-rose-soft transition-[width] duration-300 ease-linear" style={{ width: `${pct}%` }} aria-hidden />
        <div className="relative flex items-center gap-2 p-2 pl-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-text-3">{done ? "Bora, próxima série!" : `Descanso · ${rest.label}`}</p>
            <p className={`font-display tabular text-3xl font-extrabold leading-tight ${done ? "text-rose" : ""}`} aria-label={`${Math.ceil(remaining)} segundos de descanso`}>
              {formatClock(Math.ceil(remaining))}
            </p>
          </div>
          <button type="button" onClick={() => onAdjust(-15)} className="flex h-12 items-center gap-0.5 rounded-full bg-surface-2 px-3 text-sm font-bold" aria-label="Menos 15 segundos">
            <Minus className="size-3.5" />15
          </button>
          <button type="button" onClick={() => onAdjust(15)} className="flex h-12 items-center gap-0.5 rounded-full bg-surface-2 px-3 text-sm font-bold" aria-label="Mais 15 segundos">
            <Plus className="size-3.5" />15
          </button>
          <button type="button" onClick={onSkip} className="flex size-12 items-center justify-center rounded-full bg-rose text-rose-ink" aria-label="Pular descanso">
            <SkipForward className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
