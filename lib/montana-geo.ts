import { feature } from "topojson-client";
import { geoConicConformal, geoPath, type GeoProjection } from "d3-geo";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const statesTopology = require("us-atlas/states-10m.json");

export const MAP_VIEWBOX = { width: 640, height: 300 };

const MONTANA_FIPS = "30";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMontanaFeature(): any {
  const collection = feature(statesTopology, statesTopology.objects.states);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const features = "features" in collection ? (collection as any).features : [collection];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const montana = features.find((f: any) => String(f.id) === MONTANA_FIPS);
  if (!montana) throw new Error("Montana feature not found in states-10m topology");
  return montana;
}

let cached: { pathD: string; projection: GeoProjection } | null = null;

function build() {
  if (cached) return cached;
  const montana = getMontanaFeature();
  // `fitSize` alone only computes scale/translate; it doesn't touch the
  // projection's rotation, so with d3's default rotate/parallels (tuned
  // for nothing in particular) Montana's conic projection came out
  // visibly sheared. Centering the projection on Montana's own longitude
  // and standard parallels first is what actually straightens it.
  const projection = geoConicConformal()
    .rotate([110, 0])
    .parallels([45, 49])
    .fitSize([MAP_VIEWBOX.width, MAP_VIEWBOX.height], montana);
  const pathGenerator = geoPath(projection);
  cached = { pathD: pathGenerator(montana) ?? "", projection };
  return cached;
}

export function getMontanaPathD(): string {
  return build().pathD;
}

export function projectLonLat(lon: number, lat: number): [number, number] | null {
  return build().projection([lon, lat]);
}
