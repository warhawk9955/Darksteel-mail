# Claude operations guide

Read this before working on the repo. Written for future Claude Code
sessions (and the humans in the loop). Complements `PROJECT.md` —
that's the product brief, this is the "how things actually run."

## What exists right now

Milestone 1 is code-complete and verified end-to-end in Stripe test
mode against a local Supabase stack. See `MILESTONES.md` for scope.

- `/zones/[slug]` (server) renders a zone with 10 spots and a postcard
  preview (front + back). Anon RLS.
- Click an available spot → `<ClaimModal>` (client) opens → POST
  `/api/checkout` → spot flips to `pending`, Stripe Checkout session
  is returned, browser redirects.
- `/api/webhooks/stripe` handles `checkout.session.completed` (→ sold,
  idempotent on `stripe_session_id`) and `checkout.session.expired`
  (→ released). Signature-verified.
- `/checkout/success` shows confirmation. `/checkout/cancel` verifies
  with Stripe that the session is genuinely unpaid, then releases the
  spot and redirects back to the zone.
- `sweep_stale_pending_spots()` releases anything pending > 30 min.
  Schedule it via pg_cron once enabled in the Supabase dashboard
  (commented `select cron.schedule(...)` at the end of the migration).

## Local dev — from a cold start

```bash
# 1. Supabase stack (needs Docker Desktop running)
supabase start            # first run pulls images, ~5 min
npm run db:reset          # applies migration + seed

# 2. App
npm install
cp .env.example .env.local
# Fill in .env.local from supabase-start output + Stripe test keys

npm run dev               # http://localhost:3000
```

Stripe webhooks (needed before any checkout works end-to-end):

```bash
# In a separate terminal, logged into Stripe:
npm run stripe:listen     # prints whsec_... — paste into .env.local
                          # as STRIPE_WEBHOOK_SECRET_TEST and restart dev
```

Verify keys are test-mode before running anything:

```bash
npm run stripe:verify     # asserts livemode=false, sk_test_ prefix
```

## Key invariants — break these and things get weird

1. **Service-role key never ships to the browser.** It lives in
   `lib/supabase/server.ts`, which starts with `import "server-only"`.
   Importing that module from a client component is a build error.
   Anon key is in `lib/supabase/anon.ts`, fine anywhere.
2. **All anon access obeys RLS.** Public reads only. Writes are
   service-role and only happen inside server routes or server
   components.
3. **Group exclusivity is enforced at the DB.** The partial unique
   index `spots_zone_group_active_uidx` on `(zone_id, group_id) where
   status in ('pending','sold')` is the real guardrail. The precheck
   in `/api/checkout` is a UX nicety, not the authority.
4. **Webhook is authoritative for `pending → sold`.** `/checkout/
   success` never mutates. If the webhook is slow the success page
   shows "Almost there."
5. **`/checkout/cancel` verifies with Stripe before releasing.** Do
   not shortcut this — anyone could forge a session_id otherwise and
   knock out pending spots.
6. **Webhook handler is idempotent.** Key off `stripe_session_id`,
   check status before mutating. Replaying the same event is a no-op.
7. **Raw body for signature verification.** Never parse the webhook
   request as JSON before passing to `stripe.webhooks.constructEvent`
   — the HMAC is over the exact bytes Stripe sent.

## Where the tricky code lives

- `lib/db/spots.ts` — `claimPendingSpot`, `releaseSpotBySession`,
  `markSpotSoldBySession`. These are the only entry points that
  should mutate spot state. Add new lifecycle transitions here, not
  inline in route handlers.
- `supabase/migrations/20260417000000_milestone_1_init.sql` — single
  source of truth for schema + seed. Regenerate types with
  `npm run db:types` after any change.
- `lib/pricing.ts` — pure, no DB. Add tests when pricing gets
  multi-zone.

## Testing webhooks without completing payment

`scripts/replay-webhook.mjs` signs a synthetic event with the local
webhook secret and POSTs it to `/api/webhooks/stripe`. Useful for
testing idempotency and the `expired` path. Example:

```bash
# After a POST /api/checkout returns { sessionId: "cs_test_..." }:
node scripts/replay-webhook.mjs cs_test_... checkout.session.completed
node scripts/replay-webhook.mjs cs_test_... checkout.session.expired
```

Full integration walk (browser, real hosted Checkout page, test card
`4242 4242 4242 4242`) is still the authoritative success check before
calling anything done.

## Commit hygiene

- One feature per commit, small. Don't write a 500-line PR.
- Always run `npm run typecheck` before committing.
- After any migration change: `npm run db:types` and commit the
  updated `lib/supabase/types.ts` in the same commit.
- If a schema change needs a new migration, DO NOT edit the existing
  init migration — add a new file with a later timestamp.

## What is intentionally not here yet

M1 deliberately excludes:

- No advertiser auth or dashboard (Milestone 4)
- No admin panel (Milestone 5)
- No logo / creative upload (Milestone 4)
- No homepage / marketing pages beyond the zone-detail flow (Milestone 2)
- No email sends (Resend not wired yet)

If the user asks for any of the above, point them at the relevant
milestone and check if we should be doing it now or deferring.

## Gotchas we already burned time on

- Next 15.1.6 had CVE-2025-66478 — pinned to 15.5.15.
- `supabase gen types typescript` output needs a manual patch adding
  `__InternalSupabase: { PostgrestVersion: "12" }` until the CLI
  generator catches up to `@supabase/supabase-js ≥ 2.100`.
- Stripe CLI has multiple profiles. The `.env.local` test key and
  `stripe listen` must target the same profile or events never
  route. We're using the `default` (sandbox) profile.
- `requireStripe()` used to demand both secret key and webhook
  secret; that broke the checkout endpoint whenever the webhook
  secret wasn't configured. Split into `requireStripeSecret()` and
  `requireStripeWebhook()` — keep them split.
