import { formatNumber } from "@/lib/utils";

/**
 * Lightweight server-rendered chart primitives for the admin panel.
 * Design rules (dataviz): single hue for magnitude, thin marks, rounded
 * data-ends, values as direct labels in ink (never in series color),
 * 2px surface gaps between adjacent fills, recessive baselines.
 */

const BAR_HUE = "var(--brand-500)";
const BAR_TRACK = "var(--line)";

export function HBarChart({
  data,
  locale,
  maxRows = 8,
}: {
  data: { label: string; value: number }[];
  locale: string;
  maxRows?: number;
}) {
  const rows = data.slice(0, maxRows);
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div
          key={r.label}
          className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3"
          title={`${r.label}: ${formatNumber(r.value, locale)}`}
        >
          <span className="truncate text-sm text-ink-soft">{r.label}</span>
          <div
            className="h-3 overflow-hidden rounded-full"
            style={{ background: BAR_TRACK }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${(r.value / max) * 100}%`,
                background: BAR_HUE,
                minWidth: r.value > 0 ? "0.5rem" : 0,
              }}
            />
          </div>
          <span className="text-right text-sm font-semibold tabular-nums">
            {formatNumber(r.value, locale)}
          </span>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="text-sm text-muted">—</p>
      )}
    </div>
  );
}

/**
 * 100% split bar for the barter question (3 fixed segments).
 * Categorical palette validated for CVD: violet / pink / amber-700,
 * with direct labels + legend as secondary encoding.
 */
const SPLIT_COLORS = ["#7C3AED", "#EC4899", "#B45309"] as const;

export function SplitBar({
  segments,
  locale,
}: {
  segments: { label: string; value: number }[];
  locale: string;
}) {
  const total = Math.max(
    1,
    segments.reduce((a, s) => a + s.value, 0)
  );

  return (
    <div>
      <div className="flex h-5 gap-0.5 overflow-hidden rounded-full">
        {segments.map((s, i) =>
          s.value > 0 ? (
            <div
              key={s.label}
              title={`${s.label}: ${formatNumber(s.value, locale)}`}
              style={{
                width: `${(s.value / total) * 100}%`,
                background: SPLIT_COLORS[i],
              }}
            />
          ) : null
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s, i) => (
          <span key={s.label} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: SPLIT_COLORS[i] }}
            />
            <span className="text-ink-soft">{s.label}</span>
            <span className="font-semibold tabular-nums">
              {formatNumber(s.value, locale)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Min–max price range bars per service type. */
export function RangeBars({
  data,
  locale,
}: {
  data: { label: string; min: number; max: number; count: number }[];
  locale: string;
}) {
  const overallMax = Math.max(1, ...data.map((d) => d.max));

  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div
          key={d.label}
          className="grid grid-cols-[10rem_1fr_6rem] items-center gap-3"
          title={`${d.label}: ${formatNumber(d.min, locale)}–${formatNumber(d.max, locale)} EUR (n=${d.count})`}
        >
          <span className="truncate text-sm text-ink-soft">{d.label}</span>
          <div className="relative h-3 rounded-full" style={{ background: BAR_TRACK }}>
            <div
              className="absolute top-0 h-full rounded-full"
              style={{
                left: `${(d.min / overallMax) * 100}%`,
                width: `${Math.max(2, ((d.max - d.min) / overallMax) * 100)}%`,
                background: BAR_HUE,
              }}
            />
          </div>
          <span className="text-right text-sm font-semibold tabular-nums">
            {formatNumber(d.min, locale)}–{formatNumber(d.max, locale)}
          </span>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-muted">—</p>}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <p className="mb-5 font-display font-bold">{title}</p>
      {children}
    </div>
  );
}
