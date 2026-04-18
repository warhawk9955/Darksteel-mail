// One-shot verification: loads .env.local, calls stripe.balance.retrieve(),
// prints only safe metadata. Run once, then delete.
import { readFileSync } from "node:fs";
import Stripe from "stripe";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const mode = env.STRIPE_MODE ?? "test";
const key = mode === "live" ? env.STRIPE_SECRET_KEY_LIVE : env.STRIPE_SECRET_KEY_TEST;
if (!key) {
  console.error(`Missing STRIPE_SECRET_KEY_${mode.toUpperCase()}`);
  process.exit(1);
}

const keyKind = key.startsWith("sk_live_")
  ? "LIVE"
  : key.startsWith("sk_test_")
    ? "TEST"
    : "UNKNOWN";

const stripe = new Stripe(key);

try {
  const balance = await stripe.balance.retrieve();
  console.log("Key prefix :", key.slice(0, 8) + "...");
  console.log("Key kind   :", keyKind);
  console.log("STRIPE_MODE:", mode);
  console.log("livemode   :", balance.livemode);
  if (balance.livemode) {
    console.error("\n!! balance.livemode=true — this is a LIVE account. Stop.");
    process.exit(2);
  }
  if (keyKind !== "TEST") {
    console.error("\n!! Key prefix does not start with sk_test_. Stop.");
    process.exit(3);
  }
  console.log("\n✓ Test mode confirmed. Safe to build checkout.");
} catch (err) {
  console.error("Stripe API call failed:", err.message);
  process.exit(1);
}
