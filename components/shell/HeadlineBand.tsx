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
    { value: officeholders.toLocaleString("en-US"), label: "On the roster", note: "Officeholders and candidates, federal to judicial" },
    { value: moneyAbbreviated(trackedMoney), label: "Tracked money", note: "Across all listed campaigns" },
    { value: namedDonors.toLocaleString("en-US"), label: "Named donors", note: "Individuals, PACs and committees" },
    { value: percent(medianInState), label: "Median in-state", note: "Share of itemized contributions" },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] border-b border-rule">
      {cells.map((cell) => (
        <div key={cell.label} className="pt-[14px] pr-[26px] pb-[10px] sm:pt-[34px] sm:pb-[30px]">
          <div className="text-stat-headline text-ink">{cell.value}</div>
          <div className="text-eyebrow mt-3 text-accent">{cell.label}</div>
          <p className="mt-1 hidden text-[16.8px] leading-[1.45] text-ink-tertiary sm:block">{cell.note}</p>
        </div>
      ))}
    </div>
  );
}
