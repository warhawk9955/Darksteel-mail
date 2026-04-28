import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { DEFAULT_FONT_PAIRING, DEFAULT_PALETTE } from "@/lib/themes";

// site_config + site_config_public are added by the M2 migration but
// not yet in the generated Database types. We define row shapes here
// and cast through unknown for these specific calls. Re-running
// `npm run db:types` after applying the migration will surface them
// in lib/supabase/types.ts; this module can then narrow to the
// generated types in a follow-up.

export interface SiteConfigPublic {
  id: "singleton";
  business_name: string;
  tagline: string | null;
  city: string | null;
  state: string | null;
  household_count: number | null;
  ad_spot_count_default: number | null;
  card_size_inches: string | null;
  mailing_zip_codes: string[];
  reservation_deadline: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  show_email_on_site: boolean;
  show_phone_on_site: boolean;
  social_links: Record<string, string>;
  theme_palette: string;
  theme_font_pairing: string;
  logo_url: string | null;
  hero_bg_kind: "gradient" | "stock" | "upload";
  hero_bg_url: string | null;
  portrait_url: string | null;
  favicon_url: string | null;
  launched_at: string | null;
}

// Default returned when site_config_public is unreachable (DB down,
// migration not applied yet). Lets the homepage render with brand
// defaults rather than crashing the whole site.
export const DEFAULT_SITE_CONFIG: SiteConfigPublic = {
  id: "singleton",
  business_name: "Darksteel Mail",
  tagline: null,
  city: null,
  state: null,
  household_count: 5000,
  ad_spot_count_default: 16,
  card_size_inches: "9×12\"",
  mailing_zip_codes: [],
  reservation_deadline: null,
  contact_email: null,
  contact_phone: null,
  show_email_on_site: true,
  show_phone_on_site: true,
  social_links: {},
  theme_palette: DEFAULT_PALETTE,
  theme_font_pairing: DEFAULT_FONT_PAIRING,
  logo_url: null,
  hero_bg_kind: "gradient",
  hero_bg_url: null,
  portrait_url: null,
  favicon_url: null,
  launched_at: null,
};

export async function getPublicSiteConfig(
  client: SupabaseClient<Database>,
): Promise<SiteConfigPublic> {
  const untyped = client as unknown as SupabaseClient;
  const { data, error } = await untyped
    .from("site_config_public")
    .select("*")
    .maybeSingle();

  if (error) {
    // Treat any error as "fall back to defaults" — the homepage must
    // still render. The most likely cause is "migration not applied
    // on the connected DB," which is fine to swallow in dev.
    return DEFAULT_SITE_CONFIG;
  }
  if (!data) return DEFAULT_SITE_CONFIG;
  return data as SiteConfigPublic;
}

export type SiteConfigUpsert = Partial<
  Omit<SiteConfigPublic, "id" | "launched_at">
>;

export async function upsertSiteConfig(
  client: SupabaseClient<Database>,
  patch: SiteConfigUpsert,
): Promise<SiteConfigPublic> {
  const untyped = client as unknown as SupabaseClient;
  const { data, error } = await untyped
    .from("site_config")
    .upsert({ id: "singleton", ...patch })
    .select("*")
    .single();
  if (error) throw error;
  return data as SiteConfigPublic;
}

export async function setLaunched(
  client: SupabaseClient<Database>,
): Promise<SiteConfigPublic> {
  const untyped = client as unknown as SupabaseClient;
  const { data, error } = await untyped
    .from("site_config")
    .update({ launched_at: new Date().toISOString() })
    .eq("id", "singleton")
    .select("*")
    .single();
  if (error) throw error;
  return data as SiteConfigPublic;
}
