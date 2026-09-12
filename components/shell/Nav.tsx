"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SupportButton from "@/components/shell/SupportButton";

const TABS = [
  { href: "/", label: "Roster", match: (p: string) => p === "/" || p.startsWith("/officeholder") || p.startsWith("/donor") },
  { href: "/industries", label: "Industries", match: (p: string) => p.startsWith("/industries") },
  { href: "/compare", label: "Compare", match: (p: string) => p.startsWith("/compare") },
  { href: "/map", label: "Donor geography", match: (p: string) => p.startsWith("/map") },
  { href: "/rules", label: "The Rules", match: (p: string) => p.startsWith("/rules") },
];

export default function Nav() {
  const pathname = usePathname();

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
