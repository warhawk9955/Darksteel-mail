// Theme system. The active palette + font pairing are stored on
// site_config and applied as data-attributes on <html>; CSS in
// globals.css listens via [data-palette="..."] selectors.
//
// Phase 2 wires the palette swap. Font pairings are stored but not
// yet swapped at runtime — that needs additional next/font loaders
// and lands with the wizard's step 4 in Phase 3.

export interface Palette {
  slug: string;
  name: string;
  // The four swatches shown in the wizard's palette picker.
  swatches: [string, string, string, string];
}

export const PALETTES: Palette[] = [
  { slug: "midnight",   name: "Midnight",   swatches: ["#0a0a0a", "#00aaff", "#ededed", "#262626"] },
  { slug: "ocean",      name: "Ocean",      swatches: ["#0d3b66", "#1d8be3", "#f4f1de", "#1a2a3a"] },
  { slug: "emerald",    name: "Emerald",    swatches: ["#0e3b2e", "#1fb573", "#f1ede0", "#102018"] },
  { slug: "sunset",     name: "Sunset",     swatches: ["#7a2d12", "#ff7e3b", "#fff1e0", "#3d2010"] },
  { slug: "classic",    name: "Classic",    swatches: ["#0d2547", "#d4a017", "#ffffff", "#1a2a3a"] },
  { slug: "forest",     name: "Forest",     swatches: ["#1c3322", "#5fb236", "#f1ede0", "#1a2418"] },
  { slug: "berry",      name: "Berry",      swatches: ["#5b1a2e", "#e63a5f", "#ffeef2", "#2a1a20"] },
  { slug: "slate",      name: "Slate",      swatches: ["#3a4252", "#5d70ff", "#ffffff", "#252a35"] },
  { slug: "rust",       name: "Rust",       swatches: ["#7a3017", "#e96c34", "#fff1e0", "#3d1f10"] },
  { slug: "glass",      name: "Glass",      swatches: ["#0a1a2a", "#33d6f5", "#e8f4fa", "#152838"] },
  { slug: "neumorphic", name: "Neumorphic", swatches: ["#2a2640", "#6b5cff", "#e8e6f5", "#1d1a2e"] },
  { slug: "modern",     name: "Modern",     swatches: ["#0e2440", "#36a8ff", "#ffffff", "#1a2a3d"] },
  { slug: "coral",      name: "Coral",      swatches: ["#3a1530", "#f25e7a", "#ffeef2", "#241420"] },
  { slug: "sage",       name: "Sage",       swatches: ["#3a4030", "#a8c879", "#f1ede0", "#2a302a"] },
  { slug: "royal",      name: "Royal",      swatches: ["#1a1052", "#e8b820", "#ffffff", "#241a3d"] },
  { slug: "arctic",     name: "Arctic",     swatches: ["#0a253a", "#26d0e8", "#e8f4fa", "#152838"] },
  { slug: "monochrome", name: "Monochrome", swatches: ["#0a0a0a", "#9a9a9a", "#ffffff", "#2a2a2a"] },
];

export interface FontPairing {
  slug: string;
  name: string;
  display: string; // headlines
  body: string;    // running copy
}

export const FONT_PAIRINGS: FontPairing[] = [
  { slug: "modern",  name: "Modern",  display: "Anton",            body: "Manrope" },
  { slug: "classic", name: "Classic", display: "Playfair Display", body: "Source Sans 3" },
  { slug: "bold",    name: "Bold",    display: "Archivo Black",    body: "Inter" },
  { slug: "elegant", name: "Elegant", display: "Cormorant Garamond", body: "Lato" },
  { slug: "clean",   name: "Clean",   display: "Inter",            body: "Inter" },
  { slug: "fun",     name: "Fun",     display: "Fredoka",          body: "Nunito" },
];

export const DEFAULT_PALETTE = "midnight";
export const DEFAULT_FONT_PAIRING = "modern";

export function paletteSlugIsValid(slug: unknown): slug is string {
  if (typeof slug !== "string") return false;
  return PALETTES.some((p) => p.slug === slug);
}

export function fontPairingSlugIsValid(slug: unknown): slug is string {
  if (typeof slug !== "string") return false;
  return FONT_PAIRINGS.some((f) => f.slug === slug);
}
