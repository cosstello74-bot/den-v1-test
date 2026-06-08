import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import PrivacyBanner from "@/components/PrivacyBanner";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://askden.co"),
  title: "DEN — Decision Intelligence",
  description:
    "Find the perfect product in 60 seconds. Truth-calibrated recommendations powered by shared intelligence.",
  openGraph: {
    title:       "DEN — Decision Intelligence",
    description: "Stop scrolling Reddit. Get your match. Truth-calibrated electronics rankings in 60 seconds.",
    siteName:    "DEN",
    locale:      "en_GB",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "DEN — Decision Intelligence",
    description: "Stop scrolling Reddit. Get your match. Truth-calibrated electronics rankings in 60 seconds.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${outfit.variable}`}>
      <body className="min-h-screen bg-paper text-ink antialiased font-sans">
        {children}
        <PrivacyBanner />
      </body>
    </html>
  );
}
