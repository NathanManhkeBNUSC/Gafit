"use client";
import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

const noop = () => () => {};

/** True only after hydration on the client; lets pages read browser-only state safely. */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Reads a query-string flag without suspending (client only, false during SSR). */
export function useQueryFlag(name: string, value?: string) {
  return useSyncExternalStore(
    noop,
    () => {
      const v = new URLSearchParams(window.location.search).get(name);
      return value === undefined ? v !== null : v === value;
    },
    () => false,
  );
}

/** Element width tracked with ResizeObserver. */
export function useWidth(ref: RefObject<HTMLElement | null>, fallback: number) {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}
