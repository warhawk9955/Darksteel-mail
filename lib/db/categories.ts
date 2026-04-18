import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ExclusivityGroupRow =
  Database["public"]["Tables"]["exclusivity_groups"]["Row"];

/** Category joined with its exclusivity group. */
export interface CategoryWithGroup extends CategoryRow {
  group: Pick<ExclusivityGroupRow, "id" | "slug" | "name">;
}

export async function getCategoriesWithGroups(
  client: SupabaseClient<Database>,
): Promise<CategoryWithGroup[]> {
  const { data, error } = await client
    .from("categories")
    .select(
      "*, group:exclusivity_groups!inner(id, slug, name)",
    )
    .order("sort_order", { ascending: true });

  if (error) throw error;
  // The Supabase generated type expresses the joined relation as an
  // array | object depending on selectors — narrow to object here.
  return (data ?? []).map((row) => ({
    ...row,
    group: Array.isArray(row.group) ? row.group[0]! : row.group,
  }));
}
