/**
 * Approximate employer/occupation -> industry sector classifier.
 *
 * This is a v1 keyword heuristic, not a real crosswalk. Production-quality
 * classification needs an OpenSecrets/CRP-style employer mapping (or a
 * hand-built one against actual filings); see design/README.md.
 */

export const UNCLASSIFIED_SECTOR = "Other / Unclassified";

type Rule = { sector: string; keywords: RegExp; description: string };

const RULES: Rule[] = [
  { sector: "Retired / Not employed", keywords: /\b(retired|not employed|unemployed|homemaker)\b/i, description: "Retired, unemployed, or a homemaker" },
  { sector: "Agriculture & Ranching", keywords: /\b(ranch|farm|agri|livestock|cattle|dairy)\b/i, description: "Farming, ranching, livestock, or agribusiness" },
  { sector: "Energy & Natural Resources", keywords: /\b(oil|gas|mining|coal|energy|petroleum|drilling|pipeline)\b/i, description: "Oil, gas, mining, coal, or pipelines" },
  { sector: "Finance & Insurance", keywords: /\b(bank|financial|insurance|capital|invest|credit union|wealth)\b/i, description: "Banking, insurance, investing, or accounting" },
  { sector: "Healthcare", keywords: /\b(hospital|health|medical|clinic|physician|nursing|pharma)\b/i, description: "Hospitals, medicine, or pharma" },
  { sector: "Legal", keywords: /\b(law firm|attorney|legal|counsel|esq)\b/i, description: "Attorneys, law firms, or legal counsel" },
  { sector: "Real Estate & Construction", keywords: /\b(real estate|realty|construction|builder|contractor|developer)\b/i, description: "Real estate, construction, or contracting" },
  { sector: "Education", keywords: /\b(university|college|school district|education|academy)\b/i, description: "Schools, universities, or academia" },
  { sector: "Technology", keywords: /\b(software|technology|tech\b|systems|data|internet)\b/i, description: "Software, tech companies, or IT" },
  { sector: "Government", keywords: /\b(state of montana|city of|county|federal|government|u\.s\. (senate|house))\b/i, description: "Elected office, government agencies, or public administration" },
  { sector: "Manufacturing & Trades", keywords: /\b(manufactur|industries|fabrication|logging|timber|lumber)\b/i, description: "Manufacturing, industrial production, or skilled trades" },
  { sector: "Political Committees", keywords: /\b(pac|committee|party|super pac)\b/i, description: "PACs, parties, or political committees" },
  { sector: "Self-employed", keywords: /\b(self[- ]employed|self)\b/i, description: "Self-employed with no other sector fitting their work" },
];

export const SECTOR_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  RULES.map((rule) => [rule.sector, rule.description])
);

export function classifySector(employer?: string | null, occupation?: string | null): string {
  const haystack = `${employer ?? ""} ${occupation ?? ""}`.trim();
  if (!haystack) return UNCLASSIFIED_SECTOR;
  for (const rule of RULES) {
    if (rule.keywords.test(haystack)) return rule.sector;
  }
  return UNCLASSIFIED_SECTOR;
}
