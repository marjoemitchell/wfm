import FilterBar from "@/components/roster/FilterBar";
import RosterTable from "@/components/roster/RosterTable";
import { getRoster, type RosterSort } from "@/lib/queries";

export default async function RosterPage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const level = typeof searchParams.level === "string" ? searchParams.level : "All";
  const sort = (typeof searchParams.sort === "string" ? searchParams.sort : "raised") as RosterSort;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";

  const rows = await getRoster({ level, sort, query: q });

  const flatSearchParams: Record<string, string | undefined> = {
    level: typeof searchParams.level === "string" ? searchParams.level : undefined,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : undefined,
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    compare: typeof searchParams.compare === "string" ? searchParams.compare : undefined,
  };

  return (
    <div>
      <FilterBar level={level} sort={sort} searchParams={flatSearchParams} />
      <RosterTable rows={rows} />
    </div>
  );
}
