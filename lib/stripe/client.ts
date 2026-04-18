import "server-only";
import Stripe from "stripe";
import { requireStripe } from "@/lib/env";

let cached: Stripe | null = null;

/**
 * Lazy, cached Stripe client. We don't pin an API version here —
 * Stripe pins to the account's dashboard default, so test/live modes
 * stay in lock-step with whatever version is active on the Stripe
 * account. Override explicitly if we ever need deterministic behavior
 * across accounts.
 */
export function stripe(): Stripe {
  if (cached) return cached;
  const { secretKey } = requireStripe();
  cached = new Stripe(secretKey, { typescript: true });
  return cached;
}
