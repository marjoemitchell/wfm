import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBallotMeasureSpendingByCode } from "@/lib/queries";
import { getBallotMeasureInfo, ballotMeasureStatusLabel } from "@/lib/ballot-measures";
import { moneyAbbreviated } from "@/lib/format";
import BallotMeasureCommitteeList from "@/components/political-spending/BallotMeasureCommitteeList";

export async function generateMetadata(props: PageProps<"/ballot-measure/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const measure = getBallotMeasureInfo(slug);
  if (!measure) return {};
  return { title: `${measure.code}: ${measure.title}`, description: measure.description };
}

export default async function BallotMeasurePage(props: PageProps<"/ballot-measure/[slug]">) {
  const { slug } = await props.params;
  const measure = getBallotMeasureInfo(slug);
  if (!measure) notFound();

  const spending = (await getBallotMeasureSpendingByCode())[measure.code] ?? null;
  const { status } = measure;

  return (
    <div>
      <Link href="/political-spending?category=ballot-measures" className="text-eyebrow inline-block pt-[22px] text-accent">
        ← Ballot measures
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] items-end gap-[50px] border-b border-accent py-[20px] pb-[40px]">
        <div>
          <div className="text-eyebrow text-accent">
            {measure.type} · {ballotMeasureStatusLabel(status)}
          </div>
          <h1 className="text-donor-page-name mt-2 text-ink">{measure.code}</h1>
          <div className="text-recipient-name mt-3 text-ink-secondary">{measure.title}</div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <div className="text-stat-secondary text-ink">{moneyAbbreviated(spending?.supportTotal ?? 0)}</div>
            <div className="text-eyebrow mt-2 text-ink-tertiary">Spent for</div>
          </div>
          <div>
            <div className="text-stat-secondary text-ink">{moneyAbbreviated(spending?.opposeTotal ?? 0)}</div>
            <div className="text-eyebrow mt-2 text-ink-tertiary">Spent against</div>
          </div>
        </div>
      </div>

      <div className="border-b border-rule py-[26px]">
        <p className="text-body-copy max-w-[720px] text-ink-secondary">{measure.description}</p>
        {status.kind === "decided" && <p className="text-body-copy mt-3 max-w-[720px] text-ink">{status.result}.</p>}
        {status.kind === "did-not-qualify" && <p className="text-body-copy mt-3 max-w-[720px] text-ink">{status.note}</p>}
        <a href={measure.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[15.6px] text-accent hover:text-accent-hover">
          Montana Secretary of State ballot issues ↗
        </a>
      </div>

      <div className="pt-9">
        <BallotMeasureCommitteeList code={measure.code} spending={spending} />
      </div>
    </div>
  );
}
