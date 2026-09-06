import HeadlineBand from "@/components/roster/HeadlineBand";
import FilterBar from "@/components/roster/FilterBar";
import RosterTable from "@/components/roster/RosterTable";
import { getRoster, getRosterStats, type RosterSort } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function RosterPage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const level = typeof searchParams.level === "string" ? searchParams.level : "All";
  const sort = (typeof searchParams.sort === "string" ? searchParams.sort : "raised") as RosterSort;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

  const [stats, rows] = await Promise.all([getRosterStats(), getRoster({ level, sort, query: q })]);

  const flatSearchParams: Record<string, string | undefined> = {
    level: typeof searchParams.level === "string" ? searchParams.level : undefined,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : undefined,
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    compare: typeof searchParams.compare === "string" ? searchParams.compare : undefined,
  };

  return (
    <div>
      <HeadlineBand
        officeholders={stats.officeholders}
        trackedMoney={stats.trackedMoney}
        namedDonors={stats.namedDonors}
        medianInState={stats.medianInState}
      />
      <FilterBar level={level} sort={sort} searchParams={flatSearchParams} />
      <RosterTable rows={rows} />
    </div>
  );
}
