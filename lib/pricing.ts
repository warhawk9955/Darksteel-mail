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
 * Given a zone and the current sold-fraction (0..1), return the price
 * cents for the chosen tier. Founding rate applies strictly below the
 * threshold; at or above, regular rate kicks in.
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

/** Sold-fraction = (pending + sold) / total. Pending counts because
 *  those spots are not available to book. */
export function soldFraction(spots: { status: string }[]): number {
  if (spots.length === 0) return 0;
  const taken = spots.filter(
    (s) => s.status === "pending" || s.status === "sold",
  ).length;
  return taken / spots.length;
}
