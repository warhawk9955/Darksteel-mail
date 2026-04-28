# Deploy

Step-by-step from a clean machine to a live URL. Roughly 30 minutes
the first time. You need GitHub, Vercel, Supabase, and Stripe accounts
(all free for our scale).

## 1. Supabase Cloud project (~5 min)

1. https://supabase.com → New project → pick a name + region close to
   you (us-east-1 for WNY).
2. Wait for provisioning, then go to **Project Settings → API**:
   - Copy `Project URL` → that's `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key (under "Project API keys") →
     `SUPABASE_SERVICE_ROLE_KEY` (server-only, treat like a password)
3. Apply the migrations. Two options:
   - **CLI:** `supabase link --project-ref <your-ref>` then
     `supabase db push`. The three migration files in
     `supabase/migrations/` apply in order.
   - **Dashboard:** SQL Editor → paste each migration file in order
     and run. Files (apply in this order):
     1. `20260417000000_milestone_1_init.sql`
     2. `20260428000000_milestone_2_builder.sql`
     3. `20260428000001_storage_buckets.sql`
4. **Auth → URL Configuration**:
   - Site URL: leave blank for now (we'll set it after Vercel deploy)
   - We'll come back here after step 4.
5. **Database → Extensions** → enable `pg_cron` if you want the
   30-minute pending-spot sweep (optional; only matters once real
   bookings happen).

## 2. Stripe test keys (~2 min)

1. https://dashboard.stripe.com → **Developers → API keys**.
2. Copy the **test** keys:
   - `sk_test_...` → `STRIPE_SECRET_KEY_TEST`
   - `pk_test_...` → `STRIPE_PUBLISHABLE_KEY_TEST` (only used if you
     add Stripe Elements later; safe to set now)
3. Webhook endpoint comes after Vercel deploy (step 5).

## 3. Push to GitHub (~1 min)

If you haven't already:

```
git remote add origin git@github.com:<you>/Darksteel-mail.git
git push -u origin claude/darksteel-postcards-website-9V1y9
```

When it's ready, merge that branch into `main` (or deploy directly
from the feature branch — Vercel doesn't care).

## 4. Vercel deploy (~5 min)

1. https://vercel.com → **Add New → Project** → import the GitHub
   repo. Framework auto-detects as Next.js.
2. **Environment Variables** — paste these before the first build:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from step 1.2 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 1.2 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 1.2 |
   | `STRIPE_MODE` | `test` |
   | `STRIPE_SECRET_KEY_TEST` | from step 2.2 |
   | `STRIPE_WEBHOOK_SECRET_TEST` | leave blank for first deploy; fill after step 5 |
   | `NEXT_PUBLIC_SITE_URL` | leave blank; fill after first deploy gives you the URL |
   | `ADMIN_EMAIL` | the email you'll log in with |

3. Hit **Deploy**. First build takes ~2 minutes.
4. After it succeeds, copy the assigned URL (e.g.
   `darksteel-mail-xxx.vercel.app`).
5. Back in **Settings → Environment Variables**, set
   `NEXT_PUBLIC_SITE_URL` to that URL with `https://` prefix.
   Click **Redeploy** (Deployments → … → Redeploy).

## 5. Wire up Stripe webhook (~2 min)

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://<your-vercel-url>/api/webhooks/stripe`
3. Events to send: pick **checkout.session.completed** and
   **checkout.session.expired**.
4. After saving, copy the **Signing secret** (`whsec_...`).
5. Back in Vercel env vars, set `STRIPE_WEBHOOK_SECRET_TEST` to that.
   Redeploy once more.

## 6. Wire up Supabase Auth redirects (~1 min)

1. Supabase → **Auth → URL Configuration**:
   - Site URL: `https://<your-vercel-url>`
   - Redirect URLs (add): `https://<your-vercel-url>/auth/callback`
2. Save.

## 7. Verify (~5 min)

1. Open `https://<your-vercel-url>/`.
   - You should see the M2 placeholder homepage with a yellow
     "Pre-launch preview" banner.
2. Click "Reserve Your Spot" — the contact form is wired but the
   `/api/leads` endpoint lands in Phase 6, so submit will 404 for
   now. That's expected.
3. Go to `/login`. Enter your `ADMIN_EMAIL`. Click the magic link in
   your inbox. It should land you at `/admin`.
4. Click **Start setup wizard**. Walk through Name → Campaign →
   Contact → Look → Branding → Card → Domain → Review.
5. At Review, click **Launch site**. The pre-launch banner on `/`
   should disappear on next page load.
6. Go to `/zones/tonawanda-east`. The seeded card is still there.
   Click an available spot → fill the claim form → pay with
   `4242 4242 4242 4242` (any future expiry, any CVC, any ZIP) →
   Stripe completes → success page renders → that spot flips to
   "Taken" on the zone page.

If any step breaks, check the Vercel build/runtime logs first
(Project → Logs).

## 8. Custom domain (optional, ~10 min)

1. Vercel → Settings → Domains → add your domain.
2. Update DNS at your registrar with the records Vercel prints.
3. Once it's green, change `NEXT_PUBLIC_SITE_URL` to the new domain
   and update the Stripe webhook endpoint + Supabase redirect URLs.
4. Redeploy. Done.

## What's not yet wired

- `/api/leads` — Phase 6. Contact form 404s on submit.
- `/api/views` — Phase 6. No analytics tracking yet.
- `/admin` KPI tiles — Phase 6. Show placeholders.
- Font pairings other than Modern (Anton + Manrope) — Phase 7.

## Switching to live mode

After test mode looks good:
1. Stripe Dashboard → toggle to live mode.
2. Generate live keys, set `STRIPE_SECRET_KEY_LIVE` and create a new
   live webhook → `STRIPE_WEBHOOK_SECRET_LIVE`.
3. Set `STRIPE_MODE=live` in Vercel.
4. Redeploy.
5. Run `npm run stripe:verify` locally pointing at live env vars to
   sanity-check key prefixes before taking real money.
