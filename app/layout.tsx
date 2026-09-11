import type { Metadata } from "next";
import { Playfair_Display, Archivo } from "next/font/google";
import Masthead from "@/components/shell/Masthead";
import Nav from "@/components/shell/Nav";
import Footer from "@/components/shell/Footer";
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

export const metadata: Metadata = {
  title: "Who Funds Montana",
  description:
    "Tracking Montana officeholders and where their campaign money comes from.",
};

// Every page (including the built-in /_not-found) renders inside this
// layout, and the Footer queries the database for data provenance, so
// nothing here can be statically prerendered at build time.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${playfair.variable} ${archivo.variable}`}>
      <body className="min-h-screen flex flex-col bg-ground text-ink">
        <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-10 flex-1 flex flex-col">
          <Masthead />
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
