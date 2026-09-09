import { getStateFeatures, NATIONAL_VIEWBOX, sequentialRed } from "@/lib/national-geo";

export default function NationalMap({ states }: { states: { state: string; amount: number }[] }) {
  const features = getStateFeatures();
  const amountByPostal = new Map(states.map((s) => [s.state, s.amount]));
  const maxAmount = states.reduce((m, s) => Math.max(m, s.amount), 0);

  return (
    <div>
      <svg viewBox={`0 0 ${NATIONAL_VIEWBOX.width} ${NATIONAL_VIEWBOX.height}`} width="100%">
        {features.map((f) => {
          const amount = f.postal ? (amountByPostal.get(f.postal) ?? 0) : 0;
          const isMontana = f.postal === "MT";
          const t = maxAmount > 0 ? Math.sqrt(amount / maxAmount) : 0;
          const fill = amount > 0 ? sequentialRed(t) : "var(--color-ground-panel)";
          return (
            <path
              key={f.id}
              d={f.pathD}
              fill={fill}
              stroke={isMontana ? "var(--color-gold)" : "var(--color-border)"}
              strokeWidth={isMontana ? 2 : 0.5}
            />
          );
        })}
      </svg>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[12.5px] uppercase text-ink-quiet" style={{ letterSpacing: "0.14em" }}>
          Low
        </span>
        <div
          className="h-[6px] flex-1"
          style={{ background: `linear-gradient(to right, ${sequentialRed(0)}, ${sequentialRed(1)})` }}
        />
        <span className="text-[12.5px] uppercase text-ink-quiet" style={{ letterSpacing: "0.14em" }}>
          High
        </span>
      </div>
    </div>
  );
}
