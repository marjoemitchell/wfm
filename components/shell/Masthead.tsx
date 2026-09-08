"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/shell/Logo";

export default function Masthead() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onChange(next: string) {
    setValue(next);
    const params = new URLSearchParams();
    if (next.trim()) params.set("q", next);
    router.push(`/${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-accent py-[26px] pt-[26px] pb-[14px]">
      <div className="min-w-0">
        <Logo />
        <p className="text-eyebrow mt-2 text-ink-faint" style={{ letterSpacing: "0.3em" }}>
          Officeholders · Donors · 2026 cycle
        </p>
      </div>
      <div className="flex min-w-[300px] flex-[0_1_340px] items-center gap-2 border-b border-border pb-2">
        <span className="text-accent text-sm leading-none">⌕</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search names, offices, industries"
          className="w-full bg-transparent text-[14px] text-ink placeholder-ink-quiet outline-none"
        />
      </div>
    </header>
  );
}
