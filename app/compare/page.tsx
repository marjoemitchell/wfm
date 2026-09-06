import Link from "next/link";
import { getAllPoliticiansForPicker, getComparePoliticians } from "@/lib/queries";
import Picker from "@/components/compare/Picker";
import CompareCard from "@/components/compare/CompareCard";

export default async function ComparePage(props: PageProps<"/compare">) {
  const searchParams = await props.searchParams;
  const idsParam = typeof searchParams.ids === "string" ? searchParams.ids : "";
  const ids = idsParam.split(",").filter(Boolean).slice(0, 4);

  const [options, cards] = await Promise.all([
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

      <Picker options={options} />

      {cards.length > 0 ? (
        <div
          className="mt-[1px] grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-px bg-rule"
        >
          {cards.map((c) => (
            <CompareCard key={c.politician.slug} data={c} />
          ))}
        </div>
      ) : (
        <div className="py-[70px] text-center text-[13px] text-ink-quiet">
          Pick up to four officeholders to compare.
        </div>
      )}
    </div>
  );
}
