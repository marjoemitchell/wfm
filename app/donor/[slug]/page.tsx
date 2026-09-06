import { notFound } from "next/navigation";
import { getDonorBySlug } from "@/lib/queries";
import { money } from "@/lib/format";
import RecipientList from "@/components/donor/RecipientList";

export const dynamic = "force-dynamic";

export default async function DonorPage(props: PageProps<"/donor/[slug]">) {
  const { slug } = await props.params;
  const data = await getDonorBySlug(slug);
  if (!data) notFound();

  const { donor, rows, totalGiven, recipients } = data;

  return (
    <div>
      <div className="grid grid-cols-[1.6fr_1fr] items-end gap-[50px] border-b border-accent py-[20px] pb-[40px]">
        <div>
          <div className="text-eyebrow text-accent">Donor · {donor.sector}</div>
          <h1 className="text-donor-page-name mt-2 text-ink">{donor.name}</h1>
          <p className="mt-3 text-[15px] text-ink-secondary">
            {donor.employer ? `${donor.employer} · ` : ""}
            {donor.city}, {donor.state}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-stat-secondary text-ink">{money(totalGiven)}</div>
            <div className="text-eyebrow mt-2 text-ink-tertiary">Total given</div>
          </div>
          <div>
            <div className="text-stat-secondary text-ink">{recipients}</div>
            <div className="text-eyebrow mt-2 text-ink-tertiary">Recipients</div>
          </div>
        </div>
      </div>

      <div className="pt-9">
        <RecipientList rows={rows} />
      </div>
    </div>
  );
}
