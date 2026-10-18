"use client";
import { AppShell } from "@/components/app/app-shell";
import { SessionChooser } from "@/components/app/session/session-chooser";
import { SessionView } from "@/components/app/session/session-view";
import { Skeleton } from "@/components/ui/misc";
import { useActiveWorkout, useWorkout } from "@/lib/client/hooks";

export default function TreinoPage() {
  const active = useActiveWorkout();
  if (active.isLoading)
    return (
      <div className="mx-auto max-w-xl p-4">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="mt-4 h-72 rounded-lg" />
      </div>
    );
  if (!active.data)
    return (
      <AppShell>
        <SessionChooser />
      </AppShell>
    );
  return <ActiveSession id={active.data.id} />;
}

function ActiveSession({ id }: { id: string }) {
  const { data, isLoading } = useWorkout(id);
  if (isLoading || !data)
    return (
      <div className="mx-auto max-w-xl p-4">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="mt-4 h-72 rounded-lg" />
      </div>
    );
  return <SessionView key={id} workout={data.workout} cardio={data.cardio} />;
}
