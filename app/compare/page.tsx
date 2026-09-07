import Link from "next/link";
import { getAllPoliticiansForPicker, getComparePoliticians } from "@/lib/queries";
import CompareSlots from "@/components/compare/CompareSlots";

export const dynamic = "force-dynamic";

export default async function ComparePage(props: PageProps<"/compare">) {
  const searchParams = await props.searchParams;
  const idsParam = typeof searchParams.ids === "string" ? searchParams.ids : "";
  const ids = idsParam.split(",").filter(Boolean).slice(0, 4);

  const [allPoliticians, cards] = await Promise.all([
    getAllPoliticiansForPicker(),
    ids.length ? getComparePoliticians(ids) : Promise.resolve([]),
  ]);

  return (
    <div>
      <div className="flex items-end justify-between gap-[50px] border-b border-accent pb-6 pt-9">
        <div>
          <h1 className="text-page-headline text-ink">Side by side</h1>
          <p className="text-body-copy mt-3 text-ink-secondary">
            Up to four officeholders. Selections carry over from the roster.
          </p>
        </div>
        <Link
          href="/compare"
          className="text-[10.5px] uppercase text-ink-secondary"
          style={{ letterSpacing: "0.18em", border: "1px solid var(--color-border)", padding: "10px 16px" }}
        >
          Clear
        </Link>
      </div>

      <div className="pt-6">
        <CompareSlots allPoliticians={allPoliticians} cards={cards} />
      </div>
    </div>
  );
}
