import Link from "next/link";

const BRANCHES = ["All", "Federal", "Statewide", "Legislature", "Judicial"];

export function buildRosterHref(params: URLSearchParams, updates: Record<string, string>) {
  const next = new URLSearchParams(params);
  for (const [k, v] of Object.entries(updates)) {
    if (v === "" || v === "All") next.delete(k);
    else next.set(k, v);
  }
  const qs = next.toString();
  return `/${qs ? `?${qs}` : ""}`;
}

// Sorting used to have its own row here, floating unaligned to the right
// above a grid of columns it didn't actually label (see RosterTable's own
// header row, which replaced it: real headers over the real columns,
// doubling as the sort affordances instead of a separate control).
export default function FilterBar({
  level,
  searchParams,
}: {
  level: string;
  searchParams: Record<string, string | undefined>;
}) {
  const params = new URLSearchParams(
    Object.entries(searchParams).filter(([, v]) => v !== undefined) as [string, string][]
  );

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-rule py-[18px]">
      <div className="flex flex-wrap gap-[22px]">
        {BRANCHES.map((b) => {
          const active = level === b || (b === "All" && !level);
          return (
            <Link
              key={b}
              href={buildRosterHref(params, { level: b })}
              className={`text-[16.8px] pb-[3px] border-b ${
                active ? "text-ink border-accent" : "text-ink-quiet border-transparent"
              }`}
            >
              {b}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
