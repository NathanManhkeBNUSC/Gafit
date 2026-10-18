"use client";
import { useId, useMemo, useRef, useState } from "react";
import { useWidth } from "@/lib/client/use-client";

/**
 * Small single-series charts in plain SVG, built to the dataviz spec:
 * 2px line, 10% area wash, >=8px end-dot with a surface ring, hairline solid grid,
 * columns <=24px with a 4px rounded data-end, crosshair/tooltip on hover and touch.
 * Text always uses text tokens; the mark carries the color.
 */

export interface Point {
  x: string; // label (date)
  y: number;
  detail?: string; // tooltip secondary line
}

function niceTicks(min: number, max: number, count = 4) {
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * 0.1);
    min -= pad;
    max += pad;
  }
  const span = max - min;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return { lo, hi, ticks };
}

const compact = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

function Tooltip({ x, y, title, value, detail, width }: { x: number; y: number; title: string; value: string; detail?: string; width: number }) {
  const w = 132;
  const left = Math.min(Math.max(0, x - w / 2), width - w);
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-sm bg-surface-3 px-3 py-2 text-xs shadow-2"
      style={{ left, top: Math.max(0, y - 64), width: w }}
      role="status"
    >
      <p className="text-text-3">{title}</p>
      <p className="tabular text-sm font-bold text-text">{value}</p>
      {detail && <p className="tabular truncate text-text-2">{detail}</p>}
    </div>
  );
}

export function LineChart({
  data,
  unit = "",
  height = 180,
  color = "var(--rose)",
  label,
}: {
  data: Point[];
  unit?: string;
  height?: number;
  color?: string;
  label: string;
}) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const width = 340;
  const cw = useWidth(ref, width);
  const pad = { l: 36, r: 14, t: 14, b: 26 };
  const { lo, hi, ticks } = useMemo(() => {
    const ys = data.map((d) => d.y);
    return niceTicks(Math.min(...ys), Math.max(...ys));
  }, [data]);
  if (!data.length) return null;
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const px = (i: number) => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const py = (v: number) => pad.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const path = data.map((d, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(d.y).toFixed(1)}`).join(" ");
  const area = `${path} L${px(data.length - 1).toFixed(1)},${pad.t + ih} L${px(0).toFixed(1)},${pad.t + ih} Z`;
  const last = data.length - 1;
  const labelIdx = data.length <= 6 ? data.map((_, i) => i) : [0, Math.floor(last / 2), last];

  function onMove(clientX: number) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((clientX - r.left) / r.width) * width;
    const i = Math.round(((x - pad.l) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(last, i)));
  }

  const h = hover != null ? data[hover] : null;
  return (
    <div
      ref={ref}
      className="relative touch-pan-y select-none"
      onPointerMove={(e) => onMove(e.clientX)}
      onPointerDown={(e) => onMove(e.clientX)}
      onPointerLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="block w-full" role="img" aria-label={label}>
        <defs>
          <linearGradient id={`a${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.16" />
            <stop offset="1" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={py(t)} y2={py(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={pad.l - 6} y={py(t)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--text-3)">
              {compact(t)}
            </text>
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={px(i)} y={height - 8} textAnchor={i === 0 && data.length > 1 ? "start" : i === last && data.length > 1 ? "end" : "middle"} fontSize="10" fill="var(--text-3)">
            {data[i].x}
          </text>
        ))}
        <path d={area} fill={`url(#a${id})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.length <= 24 &&
          data.map((d, i) => <circle key={i} cx={px(i)} cy={py(d.y)} r="3" fill={color} stroke="var(--surface)" strokeWidth="2" />)}
        <circle cx={px(last)} cy={py(data[last].y)} r="5" fill={color} stroke="var(--surface)" strokeWidth="2" />
        {h && hover != null && (
          <g>
            <line x1={px(hover)} x2={px(hover)} y1={pad.t} y2={pad.t + ih} stroke="var(--line-strong)" strokeWidth="1" />
            <circle cx={px(hover)} cy={py(h.y)} r="6" fill={color} stroke="var(--surface)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {h && hover != null && (
        <Tooltip
          x={(px(hover) / width) * cw}
          y={(py(h.y) / height) * ((cw / width) * height)}
          width={cw}
          title={h.x}
          value={`${h.y.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${unit}`}
          detail={h.detail}
        />
      )}
    </div>
  );
}

export function ColumnChart({
  data,
  unit = "",
  height = 160,
  color = "var(--rose)",
  label,
  highlightLast = true,
}: {
  data: Point[];
  unit?: string;
  height?: number;
  color?: string;
  label: string;
  highlightLast?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const width = 340;
  const cw = useWidth(ref, width);
  const pad = { l: 32, r: 8, t: 12, b: 24 };
  const max = Math.max(1, ...data.map((d) => d.y));
  const { hi, ticks } = niceTicks(0, max, 3);
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const band = iw / Math.max(1, data.length);
  const bw = Math.min(24, band - 4);
  const py = (v: number) => pad.t + ih - (v / (hi || 1)) * ih;
  const last = data.length - 1;
  const labelEvery = data.length > 8 ? Math.ceil(data.length / 6) : 1;

  return (
    <div ref={ref} className="relative select-none" onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="block w-full" role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={py(t)} y2={py(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={pad.l - 6} y={py(t)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--text-3)">
              {compact(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad.l + band * i + band / 2;
          const top = py(d.y);
          const hgt = pad.t + ih - top;
          const r = Math.min(4, hgt);
          const x = cx - bw / 2;
          const emphasized = highlightLast ? i === last : true;
          return (
            <g key={i} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)}>
              <rect x={cx - band / 2} y={pad.t} width={band} height={ih} fill="transparent" />
              {d.y > 0 && (
                <path
                  d={`M${x},${pad.t + ih} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${pad.t + ih} Z`}
                  fill={color}
                  opacity={hover === i || (hover == null && emphasized) ? 1 : 0.45}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={cx} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--text-3)">
                  {d.x}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <Tooltip
          x={((pad.l + band * hover + band / 2) / width) * cw}
          y={(py(data[hover].y) / height) * ((cw / width) * height)}
          width={cw}
          title={data[hover].x}
          value={`${data[hover].y.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${unit}`}
          detail={data[hover].detail}
        />
      )}
    </div>
  );
}

/** Horizontal bars for a ranked breakdown (e.g., sets per muscle). Value labels sit at the tip. */
export function BarList({ items, unit = "", color = "var(--lilac)" }: { items: { label: string; value: number }[]; unit?: string; color?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it) => (
        <li key={it.label} className="grid grid-cols-[6.5rem_1fr] items-center gap-3 text-sm">
          <span className="truncate font-semibold">{it.label}</span>
          <span className="flex items-center gap-2">
            <span className="h-3 rounded-r-[4px]" style={{ width: `${Math.max(2, (it.value / max) * 85)}%`, background: color }} />
            <span className="tabular shrink-0 text-xs font-semibold text-text-2">
              {it.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
              {unit}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
