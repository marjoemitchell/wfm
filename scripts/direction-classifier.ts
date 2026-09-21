/**
 * Wraps direction-crosswalk.ts's regex heuristic with a TypeSafe fallback
 * for whatever it can't place. Only called when inferSupport has no
 * explicit signal: the regex path is free and instant, so there's no
 * reason to spend a TypeSafe call on cases it already handles.
 */
import { inferSupport } from "./direction-crosswalk";

export type DirectionResult = { support: boolean | null; confidence: number | null };

const CRITERIA = {
  support: "Positive framing, endorsement, or a call to vote for the candidate",
  oppose: "Negative framing, an attack, or a call to vote against the candidate",
  no_signal: "Just describes a cost, vendor, or service with no sentiment about any candidate",
};

// Keyed on the exact line-item text: the same vendor cost ("Direct Mail
// Production & Postage") recurs verbatim across many filings.
const cache = new Map<string, Promise<DirectionResult>>();

export async function inferSupportWithFallback(text: string): Promise<DirectionResult> {
  const { support, explicit } = inferSupport(text);
  if (explicit) return { support, confidence: null };
  if (!process.env.TYPESAFE_API_KEY) return { support: null, confidence: null };

  let pending = cache.get(text);
  if (!pending) {
    pending = classifyWithTypeSafe(text);
    cache.set(text, pending);
  }
  return pending;
}

async function classifyWithTypeSafe(text: string): Promise<DirectionResult> {
  try {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state: { expenditure_description: text },
        model: "jev-latest",
        questions: {
          direction: {
            type: "choice",
            instructions:
              "This is a line item from a campaign finance filing describing an independent expenditure. Does the text express support for or opposition to the named candidate, or is there no directional signal at all (e.g. it just names a vendor/service/cost)?",
            criteria: CRITERIA,
          },
        },
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
    const data = await res.json();
    const answer = data.answers?.direction;
    if (!answer?.choice) throw new Error("response missing direction answer");
    if (answer.choice === "support") return { support: true, confidence: answer.confidence ?? null };
    if (answer.choice === "oppose") return { support: false, confidence: answer.confidence ?? null };
    return { support: null, confidence: null };
  } catch (err) {
    console.warn(`TypeSafe direction classification failed for "${text}":`, err);
    return { support: null, confidence: null };
  }
}
