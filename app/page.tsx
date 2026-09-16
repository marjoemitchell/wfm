import type { Metadata } from "next";
import FilterBar from "@/components/roster/FilterBar";
import RosterTable from "@/components/roster/RosterTable";
import { getRoster, type RosterSort } from "@/lib/queries";

export const metadata: Metadata = {
  // `absolute`, not a plain string: the root layout's title.template
  // doesn't apply to a plain string set at this exact segment (the same
  // one the layout and its title.default live in), so a plain string
  // here would ship without the " | Who Funds Montana" suffix every
  // other page gets. `absolute` sidesteps that by spelling out the
  // whole title itself instead of relying on the template to add it.
  title: { absolute: "Officeholders & Candidates | Who Funds Montana" },
  description: "Every officeholder and candidate this tracker covers, federal to judicial, and who funds them.",
};

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
      <div className="border-b border-accent pt-[38px] pb-[26px]">
        <h1 className="text-page-headline text-ink">Officeholders &amp; candidates</h1>
        <p className="text-body-copy mt-3 max-w-[640px] text-ink-secondary">
          Every officeholder and candidate this tracker covers, federal to judicial. Click through to see who funds
          them.
        </p>
      </div>
      <FilterBar level={level} sort={sort} searchParams={flatSearchParams} />
      <RosterTable rows={rows} />
    </div>
  );
}
