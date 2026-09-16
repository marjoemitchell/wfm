"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import SupportButton from "@/components/shell/SupportButton";

const TABS = [
  { href: "/", label: "Roster", match: (p: string) => p === "/" || p.startsWith("/officeholder") || p.startsWith("/donor") },
  { href: "/industries", label: "Industries", match: (p: string) => p.startsWith("/industries") },
  { href: "/outside-spending", label: "Outside Spending", match: (p: string) => p.startsWith("/outside-spending") },
  { href: "/compare", label: "Compare", match: (p: string) => p.startsWith("/compare") },
  { href: "/map", label: "Donor geography", match: (p: string) => p.startsWith("/map") },
  { href: "/rules", label: "The Rules", match: (p: string) => p.startsWith("/rules") },
];

export default function Nav() {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // On narrow screens this bar scrolls horizontally, so the tab you just
  // navigated to (or landed on directly) can render cut off at the edge
  // rather than fully in view, exactly what a fixed scrollLeft would do
  // regardless of which tab is active. Scrolling the active one to the
  // start on every navigation keeps it consistently reachable instead of
  // wherever the bar happened to be left. block: "nearest" keeps this to
  // the bar's own horizontal scroll, not the page's vertical one, which
  // scrollIntoView will otherwise happily hijack too.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "start", block: "nearest", behavior: "smooth" });
  }, [pathname]);

  return (
    <nav
      className="sticky top-0 z-10 flex gap-[30px] overflow-x-auto border-b border-rule bg-ground"
      style={{ scrollbarWidth: "none" }}
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            ref={active ? activeRef : undefined}
            className={`text-nav-tab shrink-0 whitespace-nowrap py-[15px] ${
              active
                ? "text-ink shadow-[inset_0_-1px_0_0_var(--color-accent)]"
                : "text-ink-quiet"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
      <span className="flex-1" />
      <SupportButton />
    </nav>
  );
}
