import Link from "next/link";
import { notFound } from "next/navigation";
import { getDonorBySlug, getPoliticianNameBySlug } from "@/lib/queries";
import { money } from "@/lib/format";
import RecipientList from "@/components/donor/RecipientList";
import IndependentExpenditureCandidateList from "@/components/donor/IndependentExpenditureCandidateList";

export default async function DonorPage(props: PageProps<"/donor/[slug]">) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const fromSlug = typeof searchParams.from === "string" ? searchParams.from : null;

  const [data, from] = await Promise.all([
    getDonorBySlug(slug),
    fromSlug ? getPoliticianNameBySlug(fromSlug) : Promise.resolve(null),
  ]);
  if (!data) notFound();

  const { donor, rows, totalGiven, recipients, independentExpenditures } = data;

  // A pure independent-expenditure spender never makes direct contributions
  // by law, so totalGiven/recipients are always 0 for them — showing that
  // in the headline reads as broken next to a page full of IE activity.
  // Swap to what they've actually spent whenever there's nothing to show
  // for direct giving.
  const isPureSpender = rows.length === 0 && independentExpenditures.rows.length > 0;
  const headlineAmount = isPureSpender ? independentExpenditures.total : totalGiven;
  const headlineAmountLabel = isPureSpender ? "Total spent" : "Total given";
  const headlineCount = isPureSpender ? independentExpenditures.recipients : recipients;
  const headlineCountLabel = isPureSpender ? "Candidates" : "Recipients";

  return (
    <div>
      <Link href={from ? `/officeholder/${from.slug}` : "/"} className="text-eyebrow inline-block pt-[22px] text-accent">
        ← {from ? from.name : "Roster"}
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] items-end gap-[50px] border-b border-accent py-[20px] pb-[40px]">
        <div>
          <div className="text-eyebrow text-accent">Donor · {donor.sector}</div>
          <h1 className="text-donor-page-name mt-2 text-ink">{donor.name}</h1>
          <p className="mt-3 text-[16.5px] text-ink-secondary">
            {donor.employer ? `${donor.employer} · ` : ""}
            {donor.city}, {donor.state}
          </p>
          {(donor.committeeDesignation || donor.registeredSince) && (
            <p className="mt-3 text-[14px] text-ink-tertiary">
              {[
                donor.committeeDesignation,
                donor.committeeType,
                donor.committeeOrgType,
                donor.registeredSince ? `Registered with the FEC since ${donor.registeredSince.getFullYear()}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              {donor.fecCommitteeId && (
                <>
                  {" · "}
                  <a
                    href={`https://www.fec.gov/data/committee/${donor.fecCommitteeId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    View on FEC.gov ↗
                  </a>
                </>
              )}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            <div className="text-stat-secondary text-ink">{money(headlineAmount)}</div>
            <div className="text-eyebrow mt-2 text-ink-tertiary">{headlineAmountLabel}</div>
          </div>
          <div>
            <div className="text-stat-secondary text-ink">{headlineCount}</div>
            <div className="text-eyebrow mt-2 text-ink-tertiary">{headlineCountLabel}</div>
          </div>
        </div>
      </div>

      {donor.jfcParticipants && Array.isArray(donor.jfcParticipants) && donor.jfcParticipants.length > 0 && (
        <div className="pt-9">
          <div className="text-eyebrow border-b border-rule pb-2 text-ink-quiet">Joint fundraising participants</div>
          <p className="mt-2 text-[12px] text-ink-faint">
            This committee splits its proceeds with these committees — amounts are its own transfers to each, not money
            this candidate received directly.
          </p>
          {(donor.jfcParticipants as { committeeId: string; name: string; amount: number }[]).map((p) => (
            <div key={p.committeeId} className="flex items-center justify-between gap-4 border-b border-rule-faint py-3">
              <div className="truncate text-[15px] text-ink">{p.name}</div>
              <div className="shrink-0 text-[15px] tabular-nums text-ink">{money(p.amount)}</div>
            </div>
          ))}
        </div>
      )}

      {independentExpenditures.rows.length > 0 ? (
        <div className="pt-9">
          <IndependentExpenditureCandidateList donorName={donor.name} rows={independentExpenditures.rows} />
        </div>
      ) : (
        rows.length > 0 && (
          <div className="pt-9">
            <RecipientList rows={rows} />
          </div>
        )
      )}
    </div>
  );
}
