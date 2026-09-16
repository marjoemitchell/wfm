import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div className="border-b border-accent py-[70px] text-center">
      <h1 className="text-page-headline text-ink">Page not found</h1>
      <p className="text-body-copy mx-auto mt-3 max-w-[440px] text-ink-secondary">
        That page doesn&apos;t exist, or the link is out of date. Try the search above, or go back to the roster.
      </p>
      <Link href="/" className="text-eyebrow mt-6 inline-block text-accent hover:text-accent-hover">
        ← Roster
      </Link>
    </div>
  );
}
