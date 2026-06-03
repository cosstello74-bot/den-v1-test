import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
