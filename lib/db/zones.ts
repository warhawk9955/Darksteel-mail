import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];

export async function getZoneBySlug(
  client: SupabaseClient<Database>,
  slug: string,
): Promise<ZoneRow | null> {
  const { data, error } = await client
    .from("zones")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}
