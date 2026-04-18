import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { requireStripeWebhook } from "@/lib/env";
import { serviceClient } from "@/lib/supabase/server";
import {
  markSpotSoldBySession,
  releaseSpotBySession,
} from "@/lib/db/spots";

// Stripe sends signed JSON. We need the raw body bytes for signature
// verification — parsing with req.json() first would invalidate the
// HMAC check.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "missing_signature" },
      { status: 400 },
    );
  }

  const { webhookSecret } = requireStripeWebhook();

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    // constructEvent throws on bad signature or malformed payload.
    // Returning 400 tells Stripe we rejected the call; it will retry.
    const msg = e instanceof Error ? e.message : "invalid_signature";
    console.error("[stripe] signature verification failed:", msg);
    return NextResponse.json(
      { error: "invalid_signature", message: msg },
      { status: 400 },
    );
  }

  const svc = serviceClient();

  // Only the events we actually care about. Anything else is logged
  // and ACKed so Stripe stops retrying.
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (!session.id) {
        console.warn("[stripe] completed event without session.id");
        break;
      }
      const result = await markSpotSoldBySession(svc, session.id);
      console.log(
        `[stripe] ${event.type} session=${session.id} outcome=${result.outcome}`,
      );
      if (result.outcome === "sold") {
        // Stale the zone page cache so a refresh shows the spot grayed.
        const zoneSlug = session.metadata?.zone_slug;
        if (zoneSlug) revalidatePath(`/zones/${zoneSlug}`);
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      if (!session.id) break;
      const result = await releaseSpotBySession(svc, session.id);
      console.log(
        `[stripe] ${event.type} session=${session.id} released=${result.released}`,
      );
      if (result.released) {
        const zoneSlug = session.metadata?.zone_slug;
        if (zoneSlug) revalidatePath(`/zones/${zoneSlug}`);
      }
      break;
    }

    default:
      // Acknowledge and move on. We don't retry unknown events.
      console.log(`[stripe] ignored ${event.type}`);
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
