"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function Picker({ options }: { options: { slug: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") ?? "").split(",").filter(Boolean);

  function toggle(slug: string) {
    const next = ids.includes(slug) ? ids.filter((s) => s !== slug) : ids.length >= 4 ? ids : [...ids, slug];
    const params = new URLSearchParams(searchParams.toString());
    if (next.length) params.set("ids", next.join(","));
    else params.delete("ids");
    router.replace(`/compare?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-5 border-b border-rule py-5">
      {options.map((o) => {
        const active = ids.includes(o.slug);
        return (
          <button
            key={o.slug}
            type="button"
            onClick={() => toggle(o.slug)}
            className={`text-[12.5px] pb-[3px] border-b ${
              active ? "text-ink border-accent" : "text-ink-quiet border-transparent"
            }`}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}
