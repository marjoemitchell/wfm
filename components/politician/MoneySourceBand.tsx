import { money, percent } from "@/lib/format";

// Whether a committee spends independently on this officeholder is a
// separate question from whether one gave to them directly (the two
// stats below), and the "0% from PACs" reading is easy to mistake for
// "no committee is involved" when in fact one just spent independently
// instead of giving. hasOutsideSpending gates the note that clarifies
// this, only worth the extra sentence when it's actually true.
export default function MoneySourceBand({
  inStatePct,
  pacPct,
  itemizedTotal,
  hasOutsideSpending,
}: {
  inStatePct: number;
  pacPct: number;
  itemizedTotal: number;
  hasOutsideSpending: boolean;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[44px] border-b border-rule py-[34px]">
      <div>
        <div className="text-eyebrow text-accent">Geography of the money</div>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-percent-callout text-ink">{percent(inStatePct)}</span>
          <span className="text-[17.4px] text-ink-secondary">from Montana addresses</span>
        </div>
        <div className="mt-4 h-[3px] w-full bg-track">
          <div className="h-[3px] bg-ink" style={{ width: `${Math.min(100, inStatePct)}%` }} />
        </div>
        <p className="mt-3 text-[16.2px] text-ink-tertiary">
          {percent(100 - inStatePct)} arrives from outside the state, of {money(itemizedTotal)} itemized
        </p>
      </div>
      <div>
        <div className="text-eyebrow text-accent">PACs vs. individuals</div>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-percent-callout text-ink">{percent(pacPct)}</span>
          <span className="text-[17.4px] text-ink-secondary">from PACs & committees</span>
        </div>
        <div className="mt-4 h-[3px] w-full bg-track">
          <div className="h-[3px] bg-gold" style={{ width: `${Math.min(100, pacPct)}%` }} />
        </div>
        <p className="mt-3 text-[16.2px] text-ink-tertiary">
          {percent(100 - pacPct)} from individual contributors, of {money(itemizedTotal)} itemized
        </p>
        {hasOutsideSpending && (
          <p className="mt-2 text-[14.4px] text-ink-faint">
            This is direct giving only. A committee can also spend independently to help this candidate without
            ever appearing here, that shows up separately below.
          </p>
        )}
      </div>
    </div>
  );
}
