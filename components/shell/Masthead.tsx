"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/shell/Logo";

export default function Masthead() {
  const router = useRouter();
  const [value, setValue] = useState("");

  // A real browser refresh (not a client-side search navigation, which
  // never produces a "reload"-type navigation entry) should drop back to
  // the unfiltered roster rather than re-apply whatever search was last
  // typed — searching again is one keystroke, but there's no way back to
  // "everyone" from a stale, refreshed search except manually clearing it.
  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type !== "reload") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("q")) return;
    url.searchParams.delete("q");
    router.replace(`${url.pathname}${url.searchParams.toString() ? `?${url.searchParams}` : ""}`);
  }, [router]);

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
          Roster · Donors · 2026 cycle
        </p>
      </div>
      <div className="flex w-full min-w-0 flex-[0_1_340px] items-center gap-2 border-b border-border pb-2 sm:w-auto sm:min-w-[300px]">
        <span className="text-accent text-sm leading-none">⌕</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search names, offices, industries"
          className="w-full bg-transparent text-[16px] text-ink placeholder-ink-quiet outline-none"
        />
      </div>
    </header>
  );
}
