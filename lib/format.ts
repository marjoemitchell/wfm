export function toNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

export function money(value: { toString(): string } | number): string {
  const n = toNumber(value);
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function moneyAbbreviated(value: { toString(): string } | number): string {
  const n = toNumber(value);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function percent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function rank(index: number): string {
  return String(index + 1).padStart(2, "0");
}

const PARTY_NAMES: Record<string, string> = { R: "Republican", D: "Democrat", N: "Nonpartisan" };
export function partyFullName(party: string): string {
  return PARTY_NAMES[party] ?? party;
}

const LEVEL_LABELS: Record<string, string> = {
  FEDERAL: "Federal",
  STATEWIDE: "Statewide",
  LEGISLATURE: "Legislature",
  JUDICIAL: "Judicial",
};
export function levelLabel(level: string): string {
  return LEVEL_LABELS[level] ?? level;
}

function stripDiacritics(value: string): string {
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0)!;
    if (code >= 0x0300 && code <= 0x036f) continue; // combining marks left by NFKD
    out += ch;
  }
  return out;
}

export function slugify(value: string): string {
  return stripDiacritics(value.toLowerCase().normalize("NFKD"))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
