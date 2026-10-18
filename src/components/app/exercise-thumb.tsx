"use client";
import { Dumbbell } from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui/cn";
import { gifUrl } from "@/lib/client/hooks";

/**
 * Exercise demonstration. GIFs come from ExerciseDB on white; multiply-blending them over a
 * blush tile (--thumb) keeps them legible without being the brightest thing on the screen.
 */
export function ExerciseThumb({ id, name, size = 56, className, animate = true }: { id: string; name: string; size?: number; className?: string; animate?: boolean }) {
  const [failed, setFailed] = useState(false);
  const custom = id.startsWith("c_");
  return (
    <div
      className={cn("relative isolate shrink-0 overflow-hidden rounded-sm", custom || failed ? "bg-surface-2" : "bg-thumb", className)}
      style={{ width: size, height: size, ...(custom || failed ? {} : { background: "var(--thumb)" }) }}
    >
      {custom || failed ? (
        <div className="flex size-full items-center justify-center text-text-3">
          <Dumbbell className="size-1/2" strokeWidth={1.5} />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gifUrl(id)}
          alt={animate ? `Demonstração: ${name}` : ""}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-contain mix-blend-multiply"
        />
      )}
    </div>
  );
}
