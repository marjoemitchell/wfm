import { getMontanaPathD, MAP_VIEWBOX, projectLonLat } from "@/lib/montana-geo";
import { layoutCityLabels, bubbleRadius } from "@/lib/map-layout";
import { money } from "@/lib/format";
import cityCoords from "@/data/mt-city-coords.json";

const COORDS = cityCoords as unknown as Record<string, [number, number]>;

export default function MontanaMap({ cities, maxLabels = 6 }: { cities: { city: string; amount: number }[]; maxLabels?: number }) {
  const pathD = getMontanaPathD();
  const maxAmount = cities.reduce((m, c) => Math.max(m, c.amount), 0);

  const allBubbles = cities
    .map((c) => {
      const coords = COORDS[c.city];
      if (!coords) return null;
      const [lat, lon] = coords;
      const projected = projectLonLat(lon, lat);
      if (!projected) return null;
      return {
        city: c.city,
        amount: c.amount,
        x: projected[0],
        y: projected[1],
        radius: bubbleRadius(c.amount, maxAmount),
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  // Only the largest few cities get a text label — labeling every city
  // this map might have data for is what caused labels to collide and
  // drift off the bottom of the page previously.
  const topCities = new Set([...allBubbles].sort((a, b) => b.amount - a.amount).slice(0, maxLabels).map((b) => b.city));
  const bubbles = allBubbles.filter((b) => topCities.has(b.city));
  const unlabeledBubbles = allBubbles.filter((b) => !topCities.has(b.city));

  const labeled = layoutCityLabels(bubbles, MAP_VIEWBOX.height);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`} width="100%">
        <path d={pathD} fill="var(--color-ground-panel)" stroke="var(--color-border)" strokeWidth={1} />
        {unlabeledBubbles.map((b) => (
          <circle
            key={b.city}
            cx={b.x}
            cy={b.y}
            r={b.radius}
            fill="var(--color-accent)"
            fillOpacity={0.18}
            stroke="var(--color-accent)"
            strokeWidth={1}
          />
        ))}
        {labeled.map((b) => (
          <g key={b.city}>
            {b.labelY !== b.y && (
              <line
                x1={b.x}
                y1={b.y}
                x2={b.x}
                y2={b.labelY}
                stroke="var(--color-lead-line)"
                strokeWidth={0.75}
              />
            )}
            <circle cx={b.x} cy={b.y} r={b.radius} fill="var(--color-accent)" fillOpacity={0.18} stroke="var(--color-accent)" strokeWidth={1} />
            <circle cx={b.x} cy={b.y} r={2} fill="var(--color-accent)" />
          </g>
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0">
        {labeled.map((b) => (
          <div
            key={b.city}
            className="absolute whitespace-nowrap"
            style={{
              left: `${(b.x / MAP_VIEWBOX.width) * 100}%`,
              top: `${(b.labelY / MAP_VIEWBOX.height) * 100}%`,
              transform: "translateY(-50%)",
            }}
          >
            <div className="text-[11px] text-ink">{b.city}</div>
            <div className="text-[10.5px] tabular-nums text-ink-secondary">{money(b.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
