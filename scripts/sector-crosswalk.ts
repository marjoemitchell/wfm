/**
 * Approximate employer/occupation -> industry sector classifier.
 *
 * This is a v1 keyword heuristic, not a real crosswalk. Production-quality
 * classification needs an OpenSecrets/CRP-style employer mapping (or a
 * hand-built one against actual filings) — see design/README.md.
 */

type Rule = { sector: string; keywords: RegExp };

const RULES: Rule[] = [
  { sector: "Retired / Not employed", keywords: /\b(retired|not employed|unemployed|homemaker)\b/i },
  { sector: "Agriculture & Ranching", keywords: /\b(ranch|farm|agri|livestock|cattle|dairy)\b/i },
  { sector: "Energy & Natural Resources", keywords: /\b(oil|gas|mining|coal|energy|petroleum|drilling|pipeline)\b/i },
  { sector: "Finance & Insurance", keywords: /\b(bank|financial|insurance|capital|invest|credit union|wealth)\b/i },
  { sector: "Healthcare", keywords: /\b(hospital|health|medical|clinic|physician|nursing|pharma)\b/i },
  { sector: "Legal", keywords: /\b(law firm|attorney|legal|counsel|esq)\b/i },
  { sector: "Real Estate & Construction", keywords: /\b(real estate|realty|construction|builder|contractor|developer)\b/i },
  { sector: "Education", keywords: /\b(university|college|school district|education|academy)\b/i },
  { sector: "Technology", keywords: /\b(software|technology|tech\b|systems|data|internet)\b/i },
  { sector: "Government", keywords: /\b(state of montana|city of|county|federal|government|u\.s\. (senate|house))\b/i },
  { sector: "Manufacturing & Trades", keywords: /\b(manufactur|industries|fabrication|logging|timber|lumber)\b/i },
  { sector: "Political Committees", keywords: /\b(pac|committee|party|super pac)\b/i },
  { sector: "Self-employed", keywords: /\b(self[- ]employed|self)\b/i },
];

export function classifySector(employer?: string | null, occupation?: string | null): string {
  const haystack = `${employer ?? ""} ${occupation ?? ""}`.trim();
  if (!haystack) return "Other / Unclassified";
  for (const rule of RULES) {
    if (rule.keywords.test(haystack)) return rule.sector;
  }
  return "Other / Unclassified";
}
