"use client";

import { useRouter, useSearchParams } from "next/navigation";
import CompareCard, { type CompareCardData } from "@/components/compare/CompareCard";
import EmptySlot, { type PickerOption } from "@/components/compare/EmptySlot";

const SLOT_COUNT = 4;

export default function CompareSlots({
  allPoliticians,
  cards,
}: {
  allPoliticians: PickerOption[];
  cards: CompareCardData[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);

  function setIds(next: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set("ids", next.join(","));
    else params.delete("ids");
    router.replace(`/compare?${params.toString()}`, { scroll: false });
  }

  function addAt(index: number, slug: string) {
    const next = [...ids];
    next[index] = slug;
    setIds(next.filter(Boolean).slice(0, SLOT_COUNT));
  }

  function removeAt(index: number) {
    const next = ids.filter((_, i) => i !== index);
    setIds(next);
  }

  const cardBySlug = new Map(cards.map((c) => [c.politician.slug, c]));

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-px bg-rule">
      {Array.from({ length: SLOT_COUNT }).map((_, index) => {
        const slug = ids[index];
        const card = slug ? cardBySlug.get(slug) : undefined;
        return (
          <div key={index} className="bg-ground">
            {card ? (
              <CompareCard data={card} onRemove={() => removeAt(index)} />
            ) : (
              <EmptySlot allPoliticians={allPoliticians} excludeSlugs={ids} onPick={(picked) => addAt(index, picked)} />
            )}
          </div>
        );
      })}
    </div>
  );
}
