import { getMontanaPathD, MAP_VIEWBOX, projectLonLat } from "@/lib/montana-geo";
import { layoutCityLabels, bubbleRadius } from "@/lib/map-layout";
import cityCoords from "@/data/mt-city-coords.json";
import MontanaMapView from "@/components/map/MontanaMapView";

const COORDS = cityCoords as unknown as Record<string, [number, number]>;

// Geometry (the d3 conic projection, sqrt-based bubble radii) is computed
// here, server-side, once. It used to be recomputed client-side too after
// this became interactive, which produced last-bit floating-point
// differences between Node's and the browser's V8 for the same trig calls,
// a real hydration mismatch, not just a lint nag. Passing the already-
// computed numbers down as props avoids the client ever touching the math.
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

  // Only the largest few cities get a text label. Labeling every city
  // this map might have data for is what caused labels to collide and
  // drift off the bottom of the page previously. The rest are reachable
  // by hover/tap instead.
  const topCities = new Set([...allBubbles].sort((a, b) => b.amount - a.amount).slice(0, maxLabels).map((b) => b.city));
  const bubbles = allBubbles.filter((b) => topCities.has(b.city));
  const unlabeledBubbles = allBubbles.filter((b) => !topCities.has(b.city));
  const labeled = layoutCityLabels(bubbles, MAP_VIEWBOX.height);

  return <MontanaMapView pathD={pathD} labeled={labeled} unlabeledBubbles={unlabeledBubbles} />;
}
