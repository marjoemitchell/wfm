/**
 * Wraps sector-crosswalk.ts's regex classifier with a TypeSafe fallback for
 * whatever it can't place. Only called when the regex lands on
 * UNCLASSIFIED_SECTOR: the regex path is free and instant, so there's no
 * reason to spend a TypeSafe call on cases it already handles.
 */
import { classifySector, SECTOR_DESCRIPTIONS, UNCLASSIFIED_SECTOR } from "./sector-crosswalk";

export type SectorResult = { sector: string; confidence: number | null };

const CRITERIA: Record<string, string> = {
  ...SECTOR_DESCRIPTIONS,
  [UNCLASSIFIED_SECTOR]: "Genuinely does not fit any other category, or too vague to tell",
};

// Keyed on employer+occupation so donors who share both (common at the same
// firm) only cost one TypeSafe call per ingest run.
const cache = new Map<string, Promise<SectorResult>>();

export async function classifySectorWithFallback(
  employer: string | null,
  occupation: string | null
): Promise<SectorResult> {
  const regexSector = classifySector(employer, occupation);
  if (regexSector !== UNCLASSIFIED_SECTOR) return { sector: regexSector, confidence: null };
  if (!employer && !occupation) return { sector: regexSector, confidence: null };
  if (!process.env.TYPESAFE_API_KEY) return { sector: regexSector, confidence: null };

  const key = `${employer ?? ""}|${occupation ?? ""}`.toLowerCase();
  let pending = cache.get(key);
  if (!pending) {
    pending = classifyWithTypeSafe(employer, occupation);
    cache.set(key, pending);
  }
  return pending;
}

async function classifyWithTypeSafe(employer: string | null, occupation: string | null): Promise<SectorResult> {
  try {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state: { employer, occupation },
        model: "jev-latest",
        questions: {
          sector: {
            type: "choice",
            instructions: "Given this donor's employer and occupation, which industry sector do they belong to?",
            criteria: CRITERIA,
          },
        },
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
    const data = await res.json();
    const answer = data.answers?.sector;
    if (!answer?.choice) throw new Error("response missing sector answer");
    return { sector: answer.choice, confidence: answer.confidence ?? null };
  } catch (err) {
    console.warn(`TypeSafe sector classification failed for employer="${employer}" occupation="${occupation}":`, err);
    return { sector: UNCLASSIFIED_SECTOR, confidence: null };
  }
}
