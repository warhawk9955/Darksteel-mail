import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Card builder reads/writes. The new spot columns aren't yet in the
// generated Database types, so this file casts through unknown for
// the calls that need them. After `npm run db:types`, we can narrow
// these to typed selects.

export type SlotSize = "small" | "medium" | "large" | "mega" | "massive";
export type SlotFace = "front" | "back";

// Default per-size pricing seed used when a layout is applied for the
// first time. Operator overrides these from the wizard's card step.
export const DEFAULT_SIZE_PRICE_CENTS: Record<SlotSize, number> = {
  small:    25_000,
  medium:   50_000,
  large:    90_000,
  mega:    125_000,
  massive: 160_000,
};

export interface LayoutSlotSpec {
  position: number;
  slot_size: SlotSize;
  face: SlotFace;
  col_position: number;
  row_position: number;
  col_span: number;
  row_span: number;
}

export interface CardLayout {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  slots_definition: LayoutSlotSpec[];
}

export interface CardSlot {
  id: string;
  zone_id: string;
  position: number;
  tier: "standard" | "featured";
  status: "available" | "pending" | "sold";
  slot_size: SlotSize;
  face: SlotFace;
  col_position: number | null;
  row_position: number | null;
  col_span: number;
  row_span: number;
  founding_price_cents: number | null;
  regular_price_cents: number | null;
  business_name: string | null;
  category_id: string | null;
}

export interface CardSummary {
  zone_id: string;
  zone_slug: string;
  zone_name: string;
  drop_date: string;
  layout_id: string | null;
  layout_slug: string | null;
  layout_name: string | null;
  spots: CardSlot[];
}

export async function listCardLayouts(
  client: SupabaseClient<Database>,
): Promise<CardLayout[]> {
  const untyped = client as unknown as SupabaseClient;
  const { data, error } = await untyped
    .from("card_layouts")
    .select("id, slug, name, description, slots_definition")
    .order("name");
  if (error) throw error;
  return (data ?? []) as CardLayout[];
}

export async function getCardForZone(
  client: SupabaseClient<Database>,
  zoneId: string,
): Promise<CardSummary | null> {
  const untyped = client as unknown as SupabaseClient;
  const { data: zoneRow, error: zoneErr } = await untyped
    .from("zones")
    .select("id, slug, name, drop_date, card_layout_id")
    .eq("id", zoneId)
    .maybeSingle();
  if (zoneErr) throw zoneErr;
  if (!zoneRow) return null;

  let layoutSlug: string | null = null;
  let layoutName: string | null = null;
  if (zoneRow.card_layout_id) {
    const { data: layout } = await untyped
      .from("card_layouts")
      .select("slug, name")
      .eq("id", zoneRow.card_layout_id)
      .maybeSingle();
    layoutSlug = layout?.slug ?? null;
    layoutName = layout?.name ?? null;
  }

  const { data: spots, error: spotsErr } = await untyped
    .from("spots")
    .select(
      "id, zone_id, position, tier, status, slot_size, face, col_position, row_position, col_span, row_span, founding_price_cents, regular_price_cents, business_name, category_id",
    )
    .eq("zone_id", zoneId)
    .order("position", { ascending: true });
  if (spotsErr) throw spotsErr;

  return {
    zone_id: zoneRow.id,
    zone_slug: zoneRow.slug,
    zone_name: zoneRow.name,
    drop_date: zoneRow.drop_date,
    layout_id: zoneRow.card_layout_id ?? null,
    layout_slug: layoutSlug,
    layout_name: layoutName,
    spots: (spots ?? []) as CardSlot[],
  };
}

export interface SlotPriceUpdate {
  spot_id: string;
  founding_price_cents: number;
  regular_price_cents: number;
}

export async function updateSlotPrices(
  client: SupabaseClient<Database>,
  zoneId: string,
  updates: SlotPriceUpdate[],
): Promise<void> {
  const untyped = client as unknown as SupabaseClient;
  // Targeted updates — one row per slot.
  for (const u of updates) {
    const { error } = await untyped
      .from("spots")
      .update({
        founding_price_cents: u.founding_price_cents,
        regular_price_cents: u.regular_price_cents,
      })
      .eq("id", u.spot_id)
      .eq("zone_id", zoneId);
    if (error) throw error;
  }
}

export type ApplyLayoutResult =
  | { ok: true; spotsCreated: number }
  | { ok: false; reason: "has_active_claims" };

/**
 * Switch a zone to a new layout preset. Deletes existing spots and
 * recreates them from the preset's slots_definition. Refuses if any
 * spot is currently pending or sold — switching layouts under live
 * claims would orphan Stripe sessions.
 */
export async function applyLayoutToZone(
  client: SupabaseClient<Database>,
  zoneId: string,
  layoutId: string,
): Promise<ApplyLayoutResult> {
  const untyped = client as unknown as SupabaseClient;

  const { data: active, error: activeErr } = await untyped
    .from("spots")
    .select("id")
    .eq("zone_id", zoneId)
    .in("status", ["pending", "sold"])
    .limit(1);
  if (activeErr) throw activeErr;
  if (active && active.length > 0) return { ok: false, reason: "has_active_claims" };

  const { data: layout, error: layoutErr } = await untyped
    .from("card_layouts")
    .select("id, slots_definition")
    .eq("id", layoutId)
    .maybeSingle();
  if (layoutErr) throw layoutErr;
  if (!layout) throw new Error("layout_not_found");
  const specs = (layout.slots_definition ?? []) as LayoutSlotSpec[];

  const { error: delErr } = await untyped
    .from("spots")
    .delete()
    .eq("zone_id", zoneId);
  if (delErr) throw delErr;

  const rows = specs.map((s) => ({
    zone_id: zoneId,
    position: s.position,
    tier:
      s.slot_size === "large" || s.slot_size === "mega" || s.slot_size === "massive"
        ? "featured"
        : "standard",
    status: "available",
    slot_size: s.slot_size,
    face: s.face,
    col_position: s.col_position,
    row_position: s.row_position,
    col_span: s.col_span,
    row_span: s.row_span,
    founding_price_cents: DEFAULT_SIZE_PRICE_CENTS[s.slot_size],
    regular_price_cents: DEFAULT_SIZE_PRICE_CENTS[s.slot_size],
    card_layout_id: layoutId,
  }));

  if (rows.length > 0) {
    const { error: insErr } = await untyped.from("spots").insert(rows);
    if (insErr) throw insErr;
  }

  const { error: zoneErr } = await untyped
    .from("zones")
    .update({ card_layout_id: layoutId })
    .eq("id", zoneId);
  if (zoneErr) throw zoneErr;

  return { ok: true, spotsCreated: rows.length };
}
