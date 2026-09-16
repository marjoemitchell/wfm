import type { Metadata } from "next";
import { Playfair_Display, Archivo } from "next/font/google";
import Masthead from "@/components/shell/Masthead";
import HeadlineBand from "@/components/shell/HeadlineBand";
import Nav from "@/components/shell/Nav";
import Footer from "@/components/shell/Footer";
import { getRosterStats } from "@/lib/queries";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-display-src",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans-src",
});

const SITE_DESCRIPTION = "Tracking Montana officeholders and where their campaign money comes from.";

// Every page inherits this unless it sets its own title/description below
// (a plain `title` string here fills the %s; openGraph/twitter carry over
// to any page that doesn't override them, so a shared link previews
// something real even for a page that never sets its own).
export const metadata: Metadata = {
  title: { default: "Who Funds Montana", template: "%s | Who Funds Montana" },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: "Who Funds Montana",
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Who Funds Montana",
    description: SITE_DESCRIPTION,
  },
};

// Every page (including the built-in /_not-found) renders inside this
// layout, and the Footer queries the database for data provenance, so
// nothing here can be statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const stats = await getRosterStats();

  return (
    <html lang="en" className={`${playfair.variable} ${archivo.variable}`}>
      <body className="min-h-screen flex flex-col bg-ground text-ink">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-10 flex-1 flex flex-col">
          <Masthead />
          <HeadlineBand
            officeholders={stats.officeholders}
            trackedMoney={stats.trackedMoney}
            namedDonors={stats.namedDonors}
            medianInState={stats.medianInState}
          />
          <Nav />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
