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

export interface ZoneSummary {
  id: string;
  slug: string;
  name: string;
  zip: string;
  household_count: number;
  drop_date: string;
  total_spots: number;
  available_spots: number;
}

export async function listZoneSummaries(
  client: SupabaseClient<Database>,
): Promise<ZoneSummary[]> {
  const { data: zones, error: zonesErr } = await client
    .from("zones")
    .select("id, slug, name, zip, household_count, drop_date")
    .order("drop_date", { ascending: true });
  if (zonesErr) throw zonesErr;
  if (!zones || zones.length === 0) return [];

  const { data: spots, error: spotsErr } = await client
    .from("spots")
    .select("zone_id, status");
  if (spotsErr) throw spotsErr;

  const tally = new Map<string, { total: number; available: number }>();
  for (const s of spots ?? []) {
    const e = tally.get(s.zone_id) ?? { total: 0, available: 0 };
    e.total += 1;
    if (s.status === "available") e.available += 1;
    tally.set(s.zone_id, e);
  }

  return zones.map((z) => {
    const t = tally.get(z.id) ?? { total: 0, available: 0 };
    return {
      id: z.id,
      slug: z.slug,
      name: z.name,
      zip: z.zip,
      household_count: z.household_count,
      drop_date: z.drop_date,
      total_spots: t.total,
      available_spots: t.available,
    };
  });
}
