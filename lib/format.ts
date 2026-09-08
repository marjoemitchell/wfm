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

// Two distinct candidates (e.g. the same person running for different
// offices under separate FEC/COPP candidate ids, or two unrelated people
// who happen to share a name) can normalize to the same slug. `isTaken`
// should return false when the slug belongs to the record being written
// itself (an update, not a real collision) so it isn't needlessly suffixed.
export async function resolveUniqueSlug(baseSlug: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;
  while (await isTaken(slug)) {
    slug = `${baseSlug}-${suffix++}`;
  }
  return slug;
}

const ROMAN_SUFFIXES = new Set(["II", "III", "IV", "V", "VI", "VII", "VIII", "JR", "JR.", "SR", "SR."]);
const COURTESY_TITLES = new Set(["MR", "MR.", "MRS", "MRS.", "MS", "MS.", "DR", "DR.", "MISS"]);

function titleCaseWord(word: string): string {
  if (!word) return word;
  const upper = word.toUpperCase();
  if (ROMAN_SUFFIXES.has(upper)) return upper.replace(/\.$/, "");
  // Mc/Mac surnames: capitalize the letter right after the prefix too.
  const mc = word.match(/^(mc)([a-z].*)$/i);
  if (mc) return "Mc" + mc[2].charAt(0).toUpperCase() + mc[2].slice(1).toLowerCase();
  const mac = word.match(/^(mac)([a-z]{2,})$/i);
  if (mac) return "Mac" + mac[2].charAt(0).toUpperCase() + mac[2].slice(1).toLowerCase();
  return word
    .toLowerCase()
    .split("'")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join("'");
}

/** Normalizes a name to Title Case regardless of source casing (FEC filings come through ALL CAPS). */
export function toTitleCase(value: string): string {
  return value
    .split(/(\s+|-)/)
    .map((part) => (/^\s+$|^-$/.test(part) ? part : titleCaseWord(part)))
    .join("");
}

/**
 * FEC and COPP both give names as "LAST, FIRST MIDDLE SUFFIX" (in FEC's
 * case, all caps). Returns a "First Last" display form and a "Last,
 * First" sort key, both title-cased. Courtesy titles (Mr./Dr./...) are
 * dropped; generational suffixes (Jr./III/...) move to the end where
 * they read naturally in "First Last" order.
 */
export function parseLastFirstName(raw: string): { display: string; sortName: string } {
  const [lastRaw, restRaw] = raw.split(",").map((s) => s.trim());
  if (!restRaw) {
    const single = toTitleCase(raw.trim());
    return { display: single, sortName: single };
  }

  const last = toTitleCase(lastRaw);
  const tokens = restRaw.split(/\s+/).filter(Boolean);
  const suffixes: string[] = [];
  const firstMiddle: string[] = [];
  for (const token of tokens) {
    const upper = token.toUpperCase().replace(/\.$/, "");
    if (COURTESY_TITLES.has(token.toUpperCase()) || COURTESY_TITLES.has(upper + ".")) continue;
    if (ROMAN_SUFFIXES.has(token.toUpperCase()) || ROMAN_SUFFIXES.has(upper)) {
      suffixes.push(titleCaseWord(token));
    } else {
      firstMiddle.push(toTitleCase(token));
    }
  }

  const displayParts = [...firstMiddle, last, ...suffixes];
  const sortParts = [last + ",", ...firstMiddle, ...suffixes];
  return { display: displayParts.join(" "), sortName: sortParts.join(" ") };
}
