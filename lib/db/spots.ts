import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type SpotRow = Database["public"]["Tables"]["spots"]["Row"];

/** Public-safe fields. Never leak contact_email / stripe_session_id to
 *  anon readers — those should be stripped at the server component. */
export type PublicSpot = Pick<
  SpotRow,
  | "id"
  | "zone_id"
  | "position"
  | "tier"
  | "status"
  | "category_id"
  | "group_id"
  | "business_name"
  | "offer"
  | "url"
  | "phone"
  | "accent_color"
>;

const PUBLIC_FIELDS =
  "id, zone_id, position, tier, status, category_id, group_id, business_name, offer, url, phone, accent_color";

export async function getSpotsByZone(
  client: SupabaseClient<Database>,
  zoneId: string,
): Promise<PublicSpot[]> {
  const { data, error } = await client
    .from("spots")
    .select(PUBLIC_FIELDS)
    .eq("zone_id", zoneId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
