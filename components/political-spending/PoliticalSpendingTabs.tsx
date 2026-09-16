import Link from "next/link";

export type SpendingCategory = "candidates" | "ballot-measures";

const TABS: { key: SpendingCategory; label: string; href: string }[] = [
  { key: "candidates", label: "Candidates", href: "/political-spending" },
  { key: "ballot-measures", label: "Ballot Measures", href: "/political-spending?category=ballot-measures" },
];

export default function PoliticalSpendingTabs({ active }: { active: SpendingCategory }) {
  return (
    <div className="flex flex-wrap gap-[22px] border-b border-rule py-[18px]">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`text-[16.8px] pb-[3px] border-b ${
            active === tab.key ? "text-ink border-accent" : "text-ink-quiet border-transparent"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
