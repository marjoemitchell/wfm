import { moneyAbbreviated, percent } from "@/lib/format";

export default function HeadlineBand({
  officeholders,
  trackedMoney,
  namedDonors,
  medianInState,
}: {
  officeholders: number;
  trackedMoney: number;
  namedDonors: number;
  medianInState: number;
}) {
  const cells = [
    { value: String(officeholders), label: "Officeholders", note: "Federal, statewide, legislative, judicial" },
    { value: moneyAbbreviated(trackedMoney), label: "Tracked money", note: "Across all listed campaigns" },
    { value: String(namedDonors), label: "Named donors", note: "Individuals, PACs and committees" },
    { value: percent(medianInState), label: "Median in-state", note: "Share of itemized contributions" },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] border-b border-rule">
      {cells.map((cell) => (
        <div key={cell.label} className="pt-[34px] pr-[26px] pb-[30px]">
          <div className="text-stat-headline text-ink">{cell.value}</div>
          <div className="text-eyebrow mt-3 text-accent">{cell.label}</div>
          <p className="mt-1 text-[12px] leading-[1.45] text-ink-tertiary">{cell.note}</p>
        </div>
      ))}
    </div>
  );
}
