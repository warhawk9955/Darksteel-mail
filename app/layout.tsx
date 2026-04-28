import type { Metadata } from "next";
import { Anton, Manrope, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { anonClient } from "@/lib/supabase/anon";
import {
  DEFAULT_SITE_CONFIG,
  getPublicSiteConfig,
  type SiteConfigPublic,
} from "@/lib/db/site_config";
import {
  DEFAULT_FONT_PAIRING,
  DEFAULT_PALETTE,
  fontPairingSlugIsValid,
  paletteSlugIsValid,
} from "@/lib/themes";

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

export async function generateMetadata(): Promise<Metadata> {
  const config = await safeGetConfig();
  const description =
    config.tagline ??
    "Curated shared-mail advertising. One postcard. Local homes. Real reach.";
  return {
    title: config.business_name,
    description,
    icons: config.favicon_url ? { icon: config.favicon_url } : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const config = await safeGetConfig();
  const palette = paletteSlugIsValid(config.theme_palette)
    ? config.theme_palette
    : DEFAULT_PALETTE;
  const fontPair = fontPairingSlugIsValid(config.theme_font_pairing)
    ? config.theme_font_pairing
    : DEFAULT_FONT_PAIRING;

  return (
    <html
      lang="en"
      data-palette={palette}
      data-font-pair={fontPair}
      className={`${anton.variable} ${manrope.variable} ${jetbrains.variable} ${playfair.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

async function safeGetConfig(): Promise<SiteConfigPublic> {
  try {
    return await getPublicSiteConfig(anonClient());
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}
