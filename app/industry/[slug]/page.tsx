import Link from "next/link";
import { notFound } from "next/navigation";
import { getSectorBySlug } from "@/lib/queries";
import { money } from "@/lib/format";
import SectorDonorList from "@/components/industries/SectorDonorList";

export default async function IndustryPage(props: PageProps<"/industry/[slug]">) {
  const { slug } = await props.params;
  const data = await getSectorBySlug(slug);
  if (!data) notFound();

  const { sector, total, donorCount, donors } = data;

  return (
    <div>
      <Link href="/industries" className="text-eyebrow inline-block pt-[22px] text-accent">
        ← Industries
      </Link>

      <div className="grid grid-cols-[1.6fr_1fr] items-end gap-[50px] border-b border-accent py-[20px] pb-[40px]">
        <div>
          <div className="text-eyebrow text-accent">Industry</div>
          <h1 className="text-donor-page-name mt-2 text-ink">{sector}</h1>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-stat-secondary text-ink">{money(total)}</div>
            <div className="text-eyebrow mt-2 text-ink-tertiary">Total tracked</div>
          </div>
          <div>
            <div className="text-stat-secondary text-ink">{donorCount}</div>
            <div className="text-eyebrow mt-2 text-ink-tertiary">Donors</div>
          </div>
        </div>
      </div>

      <div className="pt-9">
        <SectorDonorList donors={donors} />
      </div>
    </div>
  );
}
