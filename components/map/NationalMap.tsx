import { getPostalToName, getStateFeatures, NATIONAL_VIEWBOX, sequentialRed } from "@/lib/national-geo";
import { moneyAbbreviated } from "@/lib/format";
import StateTable from "./StateTable";

// Evenly spaced along the gradient itself (t = 0, 0.25, 0.5, ...), not
// along the dollar amount: the ramp below is keyed by sqrt(amount / max)
// to keep a few outlier states from washing out everyone else, so equal
// steps along the bar correspond to equal steps in t, converted back to
// a dollar figure (t^2 * max) rather than to equal dollar steps.
const LEGEND_STOPS = [0, 0.25, 0.5, 0.75, 1];

export default function NationalMap({ states }: { states: { state: string; amount: number }[] }) {
  const features = getStateFeatures();
  const postalToName = getPostalToName();
  const amountByPostal = new Map(states.map((s) => [s.state, s.amount]));
  const maxAmount = states.reduce((m, s) => Math.max(m, s.amount), 0);

  const tableRows = states
    .map((s) => ({ postal: s.state, name: postalToName[s.state] ?? s.state, amount: s.amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div>
      <svg
        viewBox={`0 0 ${NATIONAL_VIEWBOX.width} ${NATIONAL_VIEWBOX.height}`}
        width="100%"
        role="img"
        aria-label="Choropleth map of the United States, shaded by total itemized contributions per state. A sortable table of the same totals follows below."
      >
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
        <div
          className="h-[6px] flex-1"
          style={{ background: `linear-gradient(to right, ${sequentialRed(0)}, ${sequentialRed(1)})` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        {LEGEND_STOPS.map((t) => (
          <span key={t} className="text-[13px] tabular-nums text-ink-quiet">
            {moneyAbbreviated(t * t * maxAmount)}
          </span>
        ))}
      </div>
      <StateTable rows={tableRows} />
    </div>
  );
}
