import Link from "next/link";
import { notFound } from "next/navigation";
import { getPoliticianBySlug } from "@/lib/queries";
import { money, partyFullName, levelLabel } from "@/lib/format";
import MoneySourceBand from "@/components/politician/MoneySourceBand";
import SectorList from "@/components/politician/SectorList";
import DonorList from "@/components/politician/DonorList";
import RecordView from "@/components/officeholder/RecordView";

const PARTY_COLOR: Record<string, string> = {
  R: "var(--color-party-r)",
  D: "var(--color-party-d)",
  N: "var(--color-party-n)",
};

export default async function OfficeholderPage(props: PageProps<"/officeholder/[slug]">) {
  const { slug } = await props.params;
  const data = await getPoliticianBySlug(slug);
  if (!data) notFound();

  const { politician, inStatePct, pacPct, sectors, topDonors } = data;

  return (
    <div>
      <RecordView slug={politician.slug} />
      <Link href="/" className="text-eyebrow inline-block pt-[22px] text-accent">
        ← Roster
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] items-end gap-[50px] border-b border-accent py-[20px] pb-[40px]">
        <div>
          <div className="text-eyebrow" style={{ color: PARTY_COLOR[politician.party] }}>
            {partyFullName(politician.party)} · {levelLabel(politician.level)}
          </div>
          <h1 className="text-detail-name mt-2 text-ink">{politician.name}</h1>
          <p className="mt-3 text-[16.5px] text-ink-secondary">
            {politician.office} · {politician.cycle} cycle
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            <div className="text-stat-secondary text-ink">{money(politician.totalRaised)}</div>
            <div className="text-eyebrow mt-2 text-ink-tertiary">Total raised</div>
          </div>
          <div>
            <div className="text-stat-secondary text-ink">{money(politician.cashOnHand)}</div>
            <div className="text-eyebrow mt-2 text-ink-tertiary">Cash on hand</div>
          </div>
        </div>
      </div>

      <MoneySourceBand inStatePct={inStatePct} pacPct={pacPct} />

      <div className="grid grid-cols-1 gap-9 pt-9 sm:grid-cols-[1fr_1.35fr] sm:gap-[56px]">
        <SectorList sectors={sectors} />
        <DonorList donors={topDonors} politicianSlug={politician.slug} />
      </div>
    </div>
  );
}
