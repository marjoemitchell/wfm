import { percent } from "@/lib/format";

export default function MoneySourceBand({ inStatePct, pacPct }: { inStatePct: number; pacPct: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[44px] border-b border-rule py-[34px]">
      <div>
        <div className="text-eyebrow text-accent">Geography of the money</div>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-percent-callout text-ink">{percent(inStatePct)}</span>
          <span className="text-[14.5px] text-ink-secondary">from Montana addresses</span>
        </div>
        <div className="mt-4 h-[3px] w-full bg-track">
          <div className="h-[3px] bg-ink" style={{ width: `${Math.min(100, inStatePct)}%` }} />
        </div>
        <p className="mt-3 text-[13.5px] text-ink-tertiary">
          {percent(100 - inStatePct)} arrives from outside the state
        </p>
      </div>
      <div>
        <div className="text-eyebrow text-accent">PACs vs. individuals</div>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-percent-callout text-ink">{percent(pacPct)}</span>
          <span className="text-[14.5px] text-ink-secondary">from PACs & committees</span>
        </div>
        <div className="mt-4 h-[3px] w-full bg-track">
          <div className="h-[3px] bg-gold" style={{ width: `${Math.min(100, pacPct)}%` }} />
        </div>
        <p className="mt-3 text-[13.5px] text-ink-tertiary">
          {percent(100 - pacPct)} from individual contributors
        </p>
      </div>
    </div>
  );
}
