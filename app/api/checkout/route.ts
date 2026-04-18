import { NextResponse } from "next/server";
import { ClaimSchema } from "@/lib/validation/claim";
import { serviceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { env } from "@/lib/env";
import {
  claimPendingSpot,
  getSpotById,
  isGroupTaken,
} from "@/lib/db/spots";
import { computePrice, soldFraction } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(status: number, code: string, message?: string) {
  return NextResponse.json({ error: code, ...(message ? { message } : {}) }, { status });
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err(400, "invalid_json");
  }

  const parsed = ClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }
  const claim = parsed.data;

  const svc = serviceClient();

  // 1. Spot must exist and be available.
  const spot = await getSpotById(svc, claim.spotId);
  if (!spot) return err(404, "spot_not_found");
  if (spot.status !== "available") return err(409, "spot_unavailable");

  // 2. Category must exist; read its group for the conflict check.
  const { data: category, error: catErr } = await svc
    .from("categories")
    .select("id, name, group_id")
    .eq("id", claim.categoryId)
    .maybeSingle();
  if (catErr) return err(500, "db_error", catErr.message);
  if (!category) return err(404, "category_not_found");

  // 3. Cheap precheck for group exclusivity. The partial unique index
  //    on (zone_id, group_id) where status in (pending, sold) is the
  //    real guarantee; this just turns the common case into a clean 409
  //    before we spend a Stripe session.
  if (await isGroupTaken(svc, spot.zone_id, category.group_id)) {
    return err(409, "group_taken");
  }

  // 4. Compute price: founding or regular, based on sold fraction.
  const { data: zone, error: zoneErr } = await svc
    .from("zones")
    .select(
      "id, slug, name, drop_date, founding_threshold, standard_founding_cents, standard_regular_cents, featured_founding_cents, featured_regular_cents",
    )
    .eq("id", spot.zone_id)
    .maybeSingle();
  if (zoneErr) return err(500, "db_error", zoneErr.message);
  if (!zone) return err(500, "zone_missing");

  const { data: zoneSpots, error: zSpotsErr } = await svc
    .from("spots")
    .select("status")
    .eq("zone_id", spot.zone_id);
  if (zSpotsErr) return err(500, "db_error", zSpotsErr.message);

  const fraction = soldFraction(zoneSpots ?? []);
  const price = computePrice(zone, spot.tier, fraction);

  // 5. Create the Stripe Checkout session. We do this BEFORE updating
  //    the spot so we have a session_id to store. If the DB update
  //    then fails (race lost / unique violation), we expire the session
  //    to keep Stripe clean.
  const dropDateLabel = new Date(zone.drop_date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  let session;
  try {
    session = await stripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: claim.contactEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: price.amountCents,
            product_data: {
              name: `Darksteel Mail — ${zone.name} · Spot ${spot.position} (${spot.tier})`,
              description: `${category.name} · ${dropDateLabel}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${env.site.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.site.url}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        spot_id: spot.id,
        zone_id: zone.id,
        zone_slug: zone.slug,
        category_id: category.id,
        tier: spot.tier,
        accent_color: claim.accentColor,
        founding_rate: price.isFoundingRate ? "true" : "false",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "stripe_error";
    return err(502, "stripe_error", msg);
  }

  // 6. Atomic claim. The partial unique index on (zone_id, group_id)
  //    enforces exclusivity under concurrency — any collision lands
  //    here as reason=group_taken.
  const result = await claimPendingSpot(svc, {
    spotId: spot.id,
    categoryId: category.id,
    stripeSessionId: session.id,
    businessName: claim.businessName,
    contactEmail: claim.contactEmail,
    offer: claim.offer,
    phone: claim.phone,
    url: claim.url,
    accentColor: claim.accentColor,
  });

  if (!result.ok) {
    // Release the Stripe session so we don't leave a zombie.
    try {
      await stripe().checkout.sessions.expire(session.id);
    } catch {
      // Expiring a session already in a terminal state returns 400.
      // We don't care — what matters is that we don't keep the DB dirty.
    }
    switch (result.reason) {
      case "spot_unavailable":
        return err(409, "spot_unavailable");
      case "group_taken":
        return err(409, "group_taken");
      default:
        return err(500, "db_error", result.detail);
    }
  }

  if (!session.url) {
    return err(502, "stripe_error", "session.url was null");
  }

  return NextResponse.json(
    { url: session.url, sessionId: session.id },
    { status: 200 },
  );
}
