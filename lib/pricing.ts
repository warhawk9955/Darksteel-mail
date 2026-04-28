// Pricing is pure. Tests can call these without a DB.
// Amounts in cents to avoid float drift.

import type { Database } from "./supabase/types";

type ZoneRow = Database["public"]["Tables"]["zones"]["Row"];
type SpotTier = Database["public"]["Enums"]["spot_tier"];

export interface PriceResult {
  amountCents: number;
  isFoundingRate: boolean;
}

/**
 * Legacy, M1 path — kept for backward compatibility. Picks the price
 * from zone-level columns based on tier. Use computeSpotPrice for
 * anything new.
 */
export function computePrice(
  zone: Pick<
    ZoneRow,
    | "founding_threshold"
    | "standard_founding_cents"
    | "standard_regular_cents"
    | "featured_founding_cents"
    | "featured_regular_cents"
  >,
  tier: SpotTier,
  soldFraction: number,
): PriceResult {
  const threshold = Number(zone.founding_threshold);
  const isFoundingRate = soldFraction < threshold;

  if (tier === "featured") {
    return {
      amountCents: isFoundingRate
        ? zone.featured_founding_cents
        : zone.featured_regular_cents,
      isFoundingRate,
    };
  }

  return {
    amountCents: isFoundingRate
      ? zone.standard_founding_cents
      : zone.standard_regular_cents,
    isFoundingRate,
  };
}

/**
 * Spot-level pricing. After M2, each spot owns founding_price_cents
 * and regular_price_cents directly (set by the wizard's card builder).
 * If a spot has neither — e.g. a row that predates the M2 backfill or
 * was inserted with NULLs — we fall back to the zone-level columns
 * via computePrice() so old data still resolves to a number.
 */
export function computeSpotPrice(
  zone: Pick<
    ZoneRow,
    | "founding_threshold"
    | "standard_founding_cents"
    | "standard_regular_cents"
    | "featured_founding_cents"
    | "featured_regular_cents"
  >,
  spot: {
    tier: SpotTier;
    founding_price_cents?: number | null;
    regular_price_cents?: number | null;
  },
  soldFraction: number,
): PriceResult {
  const threshold = Number(zone.founding_threshold);
  const isFoundingRate = soldFraction < threshold;

  if (spot.founding_price_cents != null && spot.regular_price_cents != null) {
    return {
      amountCents: isFoundingRate
        ? spot.founding_price_cents
        : spot.regular_price_cents,
      isFoundingRate,
    };
  }
  return computePrice(zone, spot.tier, soldFraction);
}

/** Sold-fraction = (pending + sold) / total. Pending counts because
 *  those spots are not available to book. */
export function soldFraction(spots: { status: string }[]): number {
  if (spots.length === 0) return 0;
  const taken = spots.filter(
    (s) => s.status === "pending" || s.status === "sold",
  ).length;
  return taken / spots.length;
}
