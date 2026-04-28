import "server-only";
import { z } from "zod";

// Server-only environment. Importing this module from a client component
// will fail at build time thanks to "server-only" above — that's how we
// enforce that SUPABASE_SERVICE_ROLE_KEY and Stripe secrets never leak.

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  STRIPE_MODE: z.enum(["test", "live"]).default("test"),
  STRIPE_SECRET_KEY_TEST: z.string().optional(),
  STRIPE_SECRET_KEY_LIVE: z.string().optional(),
  STRIPE_WEBHOOK_SECRET_TEST: z.string().optional(),
  STRIPE_WEBHOOK_SECRET_LIVE: z.string().optional(),

  NEXT_PUBLIC_SITE_URL: z.string().url(),

  ADMIN_EMAIL: z.string().email(),
});

const parsed = serverSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  STRIPE_MODE: process.env.STRIPE_MODE,
  STRIPE_SECRET_KEY_TEST: process.env.STRIPE_SECRET_KEY_TEST,
  STRIPE_SECRET_KEY_LIVE: process.env.STRIPE_SECRET_KEY_LIVE,
  STRIPE_WEBHOOK_SECRET_TEST: process.env.STRIPE_WEBHOOK_SECRET_TEST,
  STRIPE_WEBHOOK_SECRET_LIVE: process.env.STRIPE_WEBHOOK_SECRET_LIVE,

  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,

  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
});

if (!parsed.success) {
  // Throwing at module import stops the process from starting with a
  // half-configured environment. Clearer than debugging a 500 later.
  const issues = parsed.error.issues
    .map((i) => `  ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

const raw = parsed.data;

// Resolve Stripe keys based on STRIPE_MODE. The unselected pair can be
// absent in dev, but the selected pair must be present.
const stripeSecret =
  raw.STRIPE_MODE === "live"
    ? raw.STRIPE_SECRET_KEY_LIVE
    : raw.STRIPE_SECRET_KEY_TEST;
const stripeWebhookSecret =
  raw.STRIPE_MODE === "live"
    ? raw.STRIPE_WEBHOOK_SECRET_LIVE
    : raw.STRIPE_WEBHOOK_SECRET_TEST;

export const env = {
  supabase: {
    url: raw.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: raw.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: raw.SUPABASE_SERVICE_ROLE_KEY,
  },
  stripe: {
    mode: raw.STRIPE_MODE,
    // These are undefined if not set for the active mode. Consumers that
    // actually call Stripe assert at use-site for a clearer error.
    secretKey: stripeSecret,
    webhookSecret: stripeWebhookSecret,
  },
  site: {
    url: raw.NEXT_PUBLIC_SITE_URL,
  },
  admin: {
    email: raw.ADMIN_EMAIL.toLowerCase(),
  },
} as const;

/** Needed by the checkout endpoint (creates Stripe sessions). */
export function requireStripeSecret(): { secretKey: string } {
  if (!env.stripe.secretKey) {
    throw new Error(
      `STRIPE_SECRET_KEY_${env.stripe.mode.toUpperCase()} is not set`,
    );
  }
  return { secretKey: env.stripe.secretKey };
}

/** Needed by the webhook endpoint (verifies signatures). */
export function requireStripeWebhook(): { webhookSecret: string } {
  if (!env.stripe.webhookSecret) {
    throw new Error(
      `STRIPE_WEBHOOK_SECRET_${env.stripe.mode.toUpperCase()} is not set`,
    );
  }
  return { webhookSecret: env.stripe.webhookSecret };
}
