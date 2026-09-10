import Link from "next/link";

const TABS: { key: "industry" | "spending"; label: string; href: string }[] = [
  { key: "industry", label: "By industry", href: "/industries" },
  { key: "spending", label: "Outside spending", href: "/industries?view=spending" },
];

export default function IndustriesTabs({ active }: { active: "industry" | "spending" }) {
  return (
    <div className="flex flex-wrap gap-[22px] border-b border-rule py-[18px]">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`text-[14px] pb-[3px] border-b ${
            active === tab.key ? "text-ink border-accent" : "text-ink-quiet border-transparent"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
