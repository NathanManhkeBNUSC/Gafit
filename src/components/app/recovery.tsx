import { GROUP_LABEL } from "@/lib/muscles";
import type { RecoveryItem } from "@/lib/server/progress-types";

function tone(r: number) {
  if (r >= 0.9) return { color: "var(--mint)", label: "Pronto" };
  if (r >= 0.6) return { color: "var(--lilac)", label: "Quase pronto" };
  return { color: "var(--peach)", label: "Recuperando" };
}

function readyIn(r: RecoveryItem) {
  if (r.hoursSince === null || r.recovery >= 0.9) return null;
  // need ≈ hoursSince / recovery; remaining until 90%
  const need = r.recovery > 0.02 ? r.hoursSince / r.recovery : 48;
  const h = Math.max(1, Math.round(need * 0.9 - r.hoursSince));
  return h >= 24 ? `~${Math.round(h / 24)}d` : `~${h}h`;
}

/** One-line read for the home screen: what is still recovering and what is ready. */
export function RecoverySummary({ items }: { items: RecoveryItem[] }) {
  const recovering = items.filter((r) => r.hoursSince !== null && r.recovery < 0.9).sort((a, b) => a.recovery - b.recovery);
  const ready = items.filter((r) => r.hoursSince !== null && r.recovery >= 0.9);
  const fresh = items.filter((r) => r.hoursSince === null);
  return (
    <div className="flex flex-col gap-2 text-sm">
      {recovering.length > 0 && (
        <p className="flex gap-2">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-peach" aria-hidden />
          <span>
            <span className="font-semibold">Recuperando:</span>{" "}
            <span className="text-text-2">{recovering.slice(0, 4).map((r) => `${GROUP_LABEL[r.group]} (${readyIn(r)})`).join(", ")}</span>
          </span>
        </p>
      )}
      <p className="flex gap-2">
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-mint" aria-hidden />
        <span>
          <span className="font-semibold">Prontos:</span>{" "}
          <span className="text-text-2">{[...ready, ...fresh].slice(0, 6).map((r) => GROUP_LABEL[r.group]).join(", ") || "nenhum ainda"}</span>
        </span>
      </p>
    </div>
  );
}

/** Bars show estimated recovery per muscle group (based on time since training and sets done). */
export function RecoveryList({ items }: { items: RecoveryItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((r) => {
        const t = tone(r.recovery);
        const pct = Math.round(r.recovery * 100);
        return (
          <li key={r.group} className="grid grid-cols-[6rem_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate font-semibold">{GROUP_LABEL[r.group]}</span>
            <span className="h-2 overflow-hidden rounded-full bg-surface-2" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Recuperação de ${GROUP_LABEL[r.group]}`}>
              <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(4, pct)}%`, background: t.color }} />
            </span>
            <span className="whitespace-nowrap text-right text-xs font-semibold" style={{ color: t.color }}>
              {r.hoursSince === null || r.recovery >= 0.9 ? "Pronto" : `${t.label} · pronto em ${readyIn(r)}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
