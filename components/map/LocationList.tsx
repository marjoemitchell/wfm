import { money } from "@/lib/format";

export type LocationRow = {
  label: string;
  amount: number;
  committeeDominated?: boolean;
};

export default function LocationList({
  title,
  rows,
  footnote,
  barColor = "var(--color-gold)",
}: {
  title: string;
  rows: LocationRow[];
  footnote?: string;
  barColor?: string;
}) {
  const maxAmount = rows.reduce((m, r) => Math.max(m, r.amount), 0);

  return (
    <div>
      <div className="border-b border-rule pb-3 text-eyebrow text-ink-quiet">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="py-[15px]">
          <div className="flex items-baseline justify-between">
            <span className="text-[15.5px] text-ink">
              {r.label}
              {r.committeeDominated && (
                <span
                  className="ml-2 inline-block h-[7px] w-[7px] align-middle"
                  style={{ background: "var(--color-gold)" }}
                  aria-label="Dominated by committee transfers"
                />
              )}
            </span>
            <span className="text-[16px] tabular-nums text-ink-secondary">{money(r.amount)}</span>
          </div>
          <div className="mt-2 h-[2px] w-full bg-track">
            <div className="h-[2px]" style={{ width: `${maxAmount > 0 ? (r.amount / maxAmount) * 100 : 0}%`, background: barColor }} />
          </div>
        </div>
      ))}
      {footnote && (
        <p className="mt-4 flex gap-2 text-[13.5px] text-ink-faint">
          <span className="mt-[3px] inline-block h-[7px] w-[7px] shrink-0" style={{ background: "var(--color-gold)" }} />
          {footnote}
        </p>
      )}
    </div>
  );
}
