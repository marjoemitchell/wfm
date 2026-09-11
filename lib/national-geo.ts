import { feature } from "topojson-client";
import { geoAlbersUsa, geoPath } from "d3-geo";

export const NATIONAL_VIEWBOX = { width: 960, height: 600 };

// eslint-disable-next-line @typescript-eslint/no-require-imports
const statesTopology = require("us-atlas/states-10m.json");

// FIPS state code -> USPS postal abbreviation. Needed because our donor
// records store postal codes (from FEC/COPP) but the topology's feature
// ids are FIPS codes.
export const FIPS_TO_POSTAL: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
  "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
  "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
  "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
  "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
  "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
  "54": "WV", "55": "WI", "56": "WY", "72": "PR",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StateFeature = { id: string; postal: string | undefined; pathD: string; properties: any };

let cached: StateFeature[] | null = null;

export function getStateFeatures(): StateFeature[] {
  if (cached) return cached;
  const projection = geoAlbersUsa().fitSize([NATIONAL_VIEWBOX.width, NATIONAL_VIEWBOX.height], feature(statesTopology, statesTopology.objects.states) as never);
  const pathGenerator = geoPath(projection);
  const collection = feature(statesTopology, statesTopology.objects.states);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const features = "features" in collection ? (collection as any).features : [collection];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cached = features.map((f: any) => ({
    id: String(f.id),
    postal: FIPS_TO_POSTAL[String(f.id).padStart(2, "0")],
    pathD: pathGenerator(f) ?? "",
    properties: f.properties,
  }));
  return cached!;
}

/**
 * Single-hue sequential ramp for the choropleth, built from tokens already
 * in the design system (accent -> accent-hover) rather than an invented
 * scale: dark, low-chroma at the low end (near the ground color) up to
 * the bright accent-hover red at the high end. `t` is 0-1, pre-normalized
 * by the caller (e.g. via a sqrt scale, since contribution totals are
 * heavily skewed).
 */
const RAMP_LOW = { r: 0x24, g: 0x15, b: 0x12 }; // near-ground dark red
const RAMP_HIGH = { r: 0xff, g: 0x6a, b: 0x5e }; // --color-accent-hover

export function sequentialRed(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const r = Math.round(RAMP_LOW.r + (RAMP_HIGH.r - RAMP_LOW.r) * clamped);
  const g = Math.round(RAMP_LOW.g + (RAMP_HIGH.g - RAMP_LOW.g) * clamped);
  const b = Math.round(RAMP_LOW.b + (RAMP_HIGH.b - RAMP_LOW.b) * clamped);
  return `rgb(${r}, ${g}, ${b})`;
}
