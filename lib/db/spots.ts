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

/** Full row — service-role only. Use when we need contact_email,
 *  stripe_session_id, pending_at, etc. */
export async function getSpotById(
  client: SupabaseClient<Database>,
  spotId: string,
): Promise<SpotRow | null> {
  const { data, error } = await client
    .from("spots")
    .select("*")
    .eq("id", spotId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Is this (zone, group) already reserved by a pending or sold spot? */
export async function isGroupTaken(
  client: SupabaseClient<Database>,
  zoneId: string,
  groupId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("spots")
    .select("id")
    .eq("zone_id", zoneId)
    .eq("group_id", groupId)
    .in("status", ["pending", "sold"])
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export interface ClaimParams {
  spotId: string;
  categoryId: string;
  stripeSessionId: string;
  businessName: string;
  contactEmail: string;
  offer: string;
  phone: string;
  url: string;
  accentColor: string;
}

export type ClaimResult =
  | { ok: true; spot: SpotRow }
  | { ok: false; reason: "spot_unavailable" | "group_taken" | "db_error"; detail?: string };

/** Atomically flip an available spot to pending with all claim fields.
 *  Returns a structured result; the partial unique index guarantees
 *  concurrent same-group collisions fail at the DB. */
export async function claimPendingSpot(
  client: SupabaseClient<Database>,
  params: ClaimParams,
): Promise<ClaimResult> {
  const { data, error } = await client
    .from("spots")
    .update({
      status: "pending",
      category_id: params.categoryId,
      stripe_session_id: params.stripeSessionId,
      business_name: params.businessName,
      contact_email: params.contactEmail,
      offer: params.offer,
      phone: params.phone,
      url: params.url,
      accent_color: params.accentColor,
      pending_at: new Date().toISOString(),
    })
    .eq("id", params.spotId)
    .eq("status", "available")
    .select("*")
    .maybeSingle();

  if (error) {
    // Postgres 23505 = unique_violation on our partial index.
    if (error.code === "23505") {
      return { ok: false, reason: "group_taken" };
    }
    return { ok: false, reason: "db_error", detail: error.message };
  }

  if (!data) {
    // Another request beat us to this spot (status moved off 'available').
    return { ok: false, reason: "spot_unavailable" };
  }

  return { ok: true, spot: data };
}

/** Release a pending spot back to available. Used by the cancel flow
 *  and by the webhook handler on checkout.session.expired. */
export async function releaseSpotBySession(
  client: SupabaseClient<Database>,
  sessionId: string,
): Promise<{ released: boolean }> {
  const { data, error } = await client
    .from("spots")
    .update({
      status: "available",
      category_id: null,
      business_name: null,
      contact_email: null,
      offer: null,
      phone: null,
      url: null,
      accent_color: null,
      stripe_session_id: null,
      pending_at: null,
    })
    .eq("stripe_session_id", sessionId)
    .eq("status", "pending")
    .select("id");

  if (error) throw error;
  return { released: (data?.length ?? 0) > 0 };
}

/** Webhook happy path: flip pending to sold. Idempotent — if the spot
 *  is already sold with this session_id we short-circuit. */
export async function markSpotSoldBySession(
  client: SupabaseClient<Database>,
  sessionId: string,
): Promise<{ outcome: "sold" | "already_sold" | "unknown_session" }> {
  const { data: existing, error: loadErr } = await client
    .from("spots")
    .select("id, status")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (loadErr) throw loadErr;
  if (!existing) return { outcome: "unknown_session" };
  if (existing.status === "sold") return { outcome: "already_sold" };

  const { error: updErr } = await client
    .from("spots")
    .update({ status: "sold", sold_at: new Date().toISOString() })
    .eq("id", existing.id)
    .eq("status", "pending");
  if (updErr) throw updErr;
  return { outcome: "sold" };
}
