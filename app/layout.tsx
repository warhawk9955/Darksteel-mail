import type { Metadata } from "next";
import { Anton, Manrope, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

// Fonts per design-reference/brand-tokens.md. Exposed as CSS vars so
// tailwind.config.ts can reference them as font-display / font-body / etc.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const manrope = Manrope({
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const jetbrains = JetBrains_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const playfair = Playfair_Display({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Darksteel Mail",
  description:
    "Eight local businesses. One postcard. 5,000 homes. Curated shared-mail advertising for Western New York.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${manrope.variable} ${jetbrains.variable} ${playfair.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
