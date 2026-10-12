import { money } from "@/lib/format";

// Bone for money spent supporting, the signal red for opposing (the same
// pairing SplitBar uses), with anything whose direction wasn't clear left
// as unfilled track rather than guessed into either side.
export default function SupportOpposeBar({
  supportTotal,
  opposeTotal,
  unclearTotal,
}: {
  supportTotal: number;
  opposeTotal: number;
  unclearTotal: number;
}) {
  const total = supportTotal + opposeTotal + unclearTotal;
  const pct = (value: number) => (total > 0 ? (value / total) * 100 : 0);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-[16.2px]">
        <span className="text-ink-secondary">
          For: <span className="tabular-nums text-ink">{money(supportTotal)}</span>
        </span>
        <span className="text-ink-secondary">
          Against: <span className="tabular-nums text-ink">{money(opposeTotal)}</span>
        </span>
      </div>
      <div className="mt-2 flex h-[6px] w-full overflow-hidden bg-track">
        <div className="h-full bg-ink" style={{ width: `${pct(supportTotal)}%` }} />
        <div className="h-full bg-accent" style={{ width: `${pct(opposeTotal)}%` }} />
      </div>
      {unclearTotal > 0 && (
        <p className="mt-2 text-[14.4px] text-ink-faint">{money(unclearTotal)} with no clear direction</p>
      )}
    </div>
  );
}
