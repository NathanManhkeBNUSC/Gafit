import { cn } from "@/components/ui/cn";

const LETTERS = ["S", "T", "Q", "Q", "S", "S", "D"];

function localIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Monday→Sunday strip; trained days are filled rose, today is ringed. */
export function WeekStrip({ trained }: { trained: string[] }) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const set = new Set(trained);
  return (
    <ol className="grid grid-cols-7 gap-1.5" aria-label="Dias treinados nesta semana">
      {LETTERS.map((l, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const iso = localIso(d);
        const done = set.has(iso);
        const isToday = iso === localIso(today);
        const future = d > today && !isToday;
        return (
          <li key={iso} className="flex flex-col items-center gap-1.5">
            <span className={cn("text-[11px] font-semibold", isToday ? "text-text" : "text-text-3")}>{l}</span>
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-sm font-bold tabular",
                done ? "bg-rose text-rose-ink" : future ? "bg-transparent text-text-3" : "bg-surface-2 text-text-2",
                isToday && !done && "ring-2 ring-rose-line",
              )}
              aria-label={`${d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric" })}${done ? ", treinou" : ""}`}
            >
              {d.getDate()}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
