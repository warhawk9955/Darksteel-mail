// Dev helper: fire a signed webhook event for an existing session_id.
// Usage:
//   node scripts/replay-webhook.mjs <session_id> [event_type] [zone_slug]
// event_type defaults to checkout.session.completed.
// zone_slug is put in metadata so revalidatePath fires.

import { readFileSync } from "node:fs";
import Stripe from "stripe";

const [, , sessionId, eventType = "checkout.session.completed", zoneSlug = "tonawanda-east"] = process.argv;
if (!sessionId) {
  console.error("usage: node scripts/replay-webhook.mjs <session_id> [event_type] [zone_slug]");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const secret = env.STRIPE_WEBHOOK_SECRET_TEST;
if (!secret) {
  console.error("STRIPE_WEBHOOK_SECRET_TEST not set in .env.local");
  process.exit(1);
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY_TEST);

const payload = JSON.stringify({
  id: `evt_replay_${Date.now()}`,
  object: "event",
  type: eventType,
  api_version: "2024-12-18.acacia",
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: sessionId,
      object: "checkout.session",
      status: eventType === "checkout.session.expired" ? "expired" : "complete",
      payment_status: eventType === "checkout.session.expired" ? "unpaid" : "paid",
      metadata: { zone_slug: zoneSlug },
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: { id: null, idempotency_key: null },
});

const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });

const res = await fetch("http://localhost:3000/api/webhooks/stripe", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "stripe-signature": signature,
  },
  body: payload,
});
console.log(`POST /api/webhooks/stripe ${eventType} ${sessionId}`);
console.log(`  status: ${res.status}`);
console.log(`  body:   ${await res.text()}`);
