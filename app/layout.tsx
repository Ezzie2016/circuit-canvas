import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Circuit Campus",
  description: "The school portal for JSS1–SS3 classes — courses, assignments, grades, and live lessons in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${fraunces.variable} ${plexSans.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
