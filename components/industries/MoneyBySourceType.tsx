import { money, percent } from "@/lib/format";

// A separate question from which industry the money came from: who gave
// it, a named individual or a PAC/committee. See getMoneyBySourceType's
// own comment for why this is built off Contribution.isPac directly
// rather than the sector list's own "Political Committees" bucket below.
export default function MoneyBySourceType({
  individualTotal,
  pacTotal,
  individualPct,
  pacPct,
}: {
  individualTotal: number;
  pacTotal: number;
  individualPct: number;
  pacPct: number;
}) {
  return (
    <div className="border-b border-rule py-[26px]">
      <div className="text-eyebrow text-ink-quiet">Money by source type</div>
      <div className="mt-3 flex items-baseline justify-between text-[17.4px]">
        <span className="text-ink-secondary">
          Individuals: <span className="tabular-nums text-ink">{money(individualTotal)}</span>
        </span>
        <span className="text-ink-secondary">
          PACs &amp; committees: <span className="tabular-nums text-ink">{money(pacTotal)}</span>
        </span>
      </div>
      <div className="mt-3 flex h-[10px] w-full overflow-hidden">
        <div className="h-full bg-ink" style={{ width: `${Math.max(0, Math.min(100, individualPct))}%` }} />
        <div className="h-full flex-1 bg-gold" />
      </div>
      <p className="mt-3 text-[15.6px] text-ink-tertiary">
        {percent(individualPct, 1)} from named individuals, {percent(pacPct, 1)} from PACs and committees.
      </p>
    </div>
  );
}
