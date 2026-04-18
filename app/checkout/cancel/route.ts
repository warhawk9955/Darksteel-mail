import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe/client";
import { serviceClient } from "@/lib/supabase/server";
import { releaseSpotBySession } from "@/lib/db/spots";
import { env } from "@/lib/env";

// Stripe redirects here when a prospect clicks "back" or "cancel" on
// the hosted Checkout page. We verify with Stripe that the session is
// genuinely not paid, then release the pending spot immediately (rather
// than waiting on the 30-min sweep). We don't trust the session_id
// alone — anyone could GET this URL with any value — so the Stripe
// lookup is the guard.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  let redirectZone = "tonawanda-east";

  if (sessionId) {
    try {
      const session = await stripe().checkout.sessions.retrieve(sessionId);

      const metadataZone = session.metadata?.zone_slug;
      if (typeof metadataZone === "string" && metadataZone.length > 0) {
        redirectZone = metadataZone;
      }

      // Only release when the session is demonstrably not paid.
      // status:         'open' | 'complete' | 'expired'
      // payment_status: 'paid' | 'unpaid'   | 'no_payment_required'
      const isPaid = session.payment_status === "paid";
      const isComplete = session.status === "complete";
      if (!isPaid && !isComplete) {
        const svc = serviceClient();
        const { released } = await releaseSpotBySession(svc, sessionId);
        if (released) {
          revalidatePath(`/zones/${redirectZone}`);
          console.log(
            `[checkout/cancel] released spot for session ${sessionId}`,
          );
        }
      }
    } catch (e) {
      // Invalid session id, wrong account, network blip — log and fall
      // through to a plain redirect so the user never sees an error page.
      const msg = e instanceof Error ? e.message : "stripe_error";
      console.warn(`[checkout/cancel] session lookup failed: ${msg}`);
    }
  }

  return NextResponse.redirect(`${env.site.url}/zones/${redirectZone}`, {
    status: 303,
  });
}
