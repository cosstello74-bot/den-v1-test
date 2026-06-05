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
  title: "DEN — Decision Intelligence",
  description:
    "Find the perfect product in 60 seconds. Truth-calibrated recommendations powered by shared intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${outfit.variable}`}>
      <body className="min-h-screen bg-gray-950 text-white antialiased font-sans">
        {children}
        <PrivacyBanner />
      </body>
    </html>
  );
}
