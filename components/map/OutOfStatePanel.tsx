import { money } from "@/lib/format";

export default function OutOfStatePanel({ states }: { states: { state: string; amount: number }[] }) {
  const maxAmount = states.reduce((m, s) => Math.max(m, s.amount), 0);

  return (
    <div>
      <div className="border-b border-rule pb-3 text-eyebrow text-ink-quiet">Out of state</div>
      {states.map((s) => (
        <div key={s.state} className="py-[15px]">
          <div className="flex items-baseline justify-between">
            <span className="text-[13.5px] text-ink">{s.state}</span>
            <span className="text-[14px] tabular-nums text-ink-secondary">{money(s.amount)}</span>
          </div>
          <div className="mt-2 h-[2px] w-full bg-track">
            <div className="h-[2px] bg-gold" style={{ width: `${maxAmount > 0 ? (s.amount / maxAmount) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
