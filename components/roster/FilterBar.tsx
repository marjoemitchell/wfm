import Link from "next/link";

const BRANCHES = ["All", "Federal", "Statewide", "Legislature", "Judicial"];
const SORTS: { key: "raised" | "instate" | "name"; label: string }[] = [
  { key: "raised", label: "Total raised" },
  { key: "instate", label: "In-state %" },
  { key: "name", label: "Name" },
];

function buildHref(params: URLSearchParams, updates: Record<string, string>) {
  const next = new URLSearchParams(params);
  for (const [k, v] of Object.entries(updates)) {
    if (v === "" || v === "All") next.delete(k);
    else next.set(k, v);
  }
  const qs = next.toString();
  return `/${qs ? `?${qs}` : ""}`;
}

export default function FilterBar({
  level,
  sort,
  searchParams,
}: {
  level: string;
  sort: string;
  searchParams: Record<string, string | undefined>;
}) {
  const params = new URLSearchParams(
    Object.entries(searchParams).filter(([, v]) => v !== undefined) as [string, string][]
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-[18px]">
      <div className="flex flex-wrap gap-[22px]">
        {BRANCHES.map((b) => {
          const active = level === b || (b === "All" && !level);
          return (
            <Link
              key={b}
              href={buildHref(params, { level: b })}
              className={`text-[14px] pb-[3px] border-b ${
                active ? "text-ink border-accent" : "text-ink-quiet border-transparent"
              }`}
            >
              {b}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-[22px]">
        <span className="text-[12px] tracking-[0.2em] uppercase text-ink-quiet">Sort</span>
        {SORTS.map((s) => {
          const active = sort === s.key || (!sort && s.key === "raised");
          return (
            <Link
              key={s.key}
              href={buildHref(params, { sort: s.key })}
              className={`text-[14px] pb-[3px] border-b ${
                active ? "text-ink border-accent" : "text-ink-quiet border-transparent"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
