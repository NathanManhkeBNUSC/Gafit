"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChartLine, ChevronLeft, ClipboardList, Dumbbell, House, UserRound } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/components/ui/cn";
import { useActiveWorkout } from "@/lib/client/hooks";
import { formatClock } from "@/lib/training";

const TABS = [
  { href: "/", label: "Início", icon: House, match: (p: string) => p === "/" },
  { href: "/fichas", label: "Fichas", icon: ClipboardList, match: (p: string) => p.startsWith("/fichas") || p.startsWith("/exercicios") },
  { href: "/treino", label: "Treinar", icon: Dumbbell, match: (p: string) => p.startsWith("/treino"), primary: true },
  { href: "/progresso", label: "Progresso", icon: ChartLine, match: (p: string) => p.startsWith("/progresso") || p.startsWith("/historico") || p.startsWith("/cardio") },
  { href: "/perfil", label: "Perfil", icon: UserRound, match: (p: string) => p.startsWith("/perfil") },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <main className="flex-1 px-4 pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+88px)] pt-[max(16px,env(safe-area-inset-top))]">
        {children}
      </main>
      <ActiveWorkoutPill hidden={pathname === "/" || pathname.startsWith("/treino") || pathname.startsWith("/fichas/")} />
      <nav
        aria-label="Navegação principal"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-elev/95 backdrop-blur-md"
      >
        <ul className="mx-auto flex h-[var(--nav-h)] max-w-xl items-stretch justify-around px-2">
          {TABS.map((t) => {
            const active = t.match(pathname);
            const Icon = t.icon;
            return (
              <li key={t.href} className="flex flex-1">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                    active ? "text-rose" : "text-text-3 hover:text-text-2",
                  )}
                >
                  {t.primary ? (
                    <span
                      className={cn(
                        "-mt-6 flex size-14 items-center justify-center rounded-full bg-rose text-rose-ink shadow-rose ring-4 ring-bg transition-transform active:scale-95",
                      )}
                    >
                      <Icon className="size-6" strokeWidth={2.4} />
                    </span>
                  ) : (
                    <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
                  )}
                  <span className={cn(t.primary && "-mt-0.5")}>{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function ActiveWorkoutPill({ hidden }: { hidden: boolean }) {
  const { data: active } = useActiveWorkout();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  if (!active || hidden) return null;
  const elapsed = (now - new Date(active.startedAt).getTime()) / 1000;
  return (
    <Link
      href="/treino"
      className="anim-rise fixed inset-x-4 bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom)+12px)] z-40 mx-auto flex max-w-[calc(36rem-2rem)] items-center gap-3 rounded-full bg-rose py-2 pl-2 pr-5 text-rose-ink shadow-rose"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-rose-ink/15">
        <span className="size-2.5 animate-pulse rounded-full bg-rose-ink" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold">{active.name}</span>
      <span className="tabular text-sm font-bold">{formatClock(elapsed)}</span>
    </Link>
  );
}

export function PageHeader({ title, subtitle, back, actions }: { title: ReactNode; subtitle?: ReactNode; back?: string | (() => void); actions?: ReactNode }) {
  return (
    <header className="mb-6 flex items-start gap-2">
      {back && <BackButton to={back} />}
      <div className={cn("min-w-0 flex-1", back && "pt-1.5")}>
        <h1 className={cn("font-extrabold", back ? "text-2xl" : "text-3xl")}>{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1 pt-1">{actions}</div>}
    </header>
  );
}

export function BackButton({ to }: { to: string | (() => void) }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => {
        if (typeof to === "function") to();
        else if (window.history.length > 1) router.back();
        else router.push(to);
      }}
      className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-text-2 hover:bg-surface-2 hover:text-text"
    >
      <ChevronLeft className="size-6" />
    </button>
  );
}
