import type { Party } from "@/lib/generated/prisma/enums";

const PARTY: Record<Party, { label: string; color: string }> = {
  R: { label: "REP", color: "var(--color-party-r)" },
  D: { label: "DEM", color: "var(--color-party-d)" },
  N: { label: "NONPARTISAN", color: "var(--color-party-n)" },
};

export default function PartyChip({ party, bordered = true }: { party: Party; bordered?: boolean }) {
  const { label, color } = PARTY[party];
  return (
    <span
      className="inline-block text-[10px] uppercase px-2 py-[3px]"
      style={{
        color,
        letterSpacing: "0.16em",
        border: bordered ? `1px solid ${color}` : undefined,
      }}
    >
      {label}
    </span>
  );
}
