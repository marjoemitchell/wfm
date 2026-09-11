import { money, percent } from "@/lib/format";

export default function SplitBar({
  inStateTotal,
  outOfStateTotal,
  inStatePct,
}: {
  inStateTotal: number;
  outOfStateTotal: number;
  inStatePct: number;
}) {
  return (
    <div className="border-b border-rule py-[26px]">
      <div className="flex items-baseline justify-between text-[17.4px]">
        <span className="text-ink-secondary">
          In-state: <span className="tabular-nums text-ink">{money(inStateTotal)}</span>
        </span>
        <span className="text-ink-secondary">
          Out-of-state: <span className="tabular-nums text-ink">{money(outOfStateTotal)}</span>
        </span>
      </div>
      <div className="mt-3 flex h-[10px] w-full overflow-hidden">
        <div className="h-full bg-ink" style={{ width: `${Math.max(0, Math.min(100, inStatePct))}%` }} />
        <div className="h-full flex-1 bg-accent" />
      </div>
      <p className="mt-3 text-[17.4px] text-ink-tertiary">
        Montana addresses account for <span className="text-ink">{percent(inStatePct, 1)}</span> of tracked money.
      </p>
    </div>
  );
}
