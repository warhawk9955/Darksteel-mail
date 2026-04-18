# Darksteel Mail

**One-line summary:** A shared-mail advertising network for local businesses. Businesses buy one of 10 spots on a monthly postcard that drops to 5,000 households in a defined zone. Self-serve booking via a website, Stripe-powered checkout, category exclusivity guaranteed.

**Current status:** Pre-launch. Design artifacts complete. Ready to build the platform.

---

## Who this is for

The buyer is a small local business owner — dentist, HVAC company, med spa, roofer, pizza place, vet, gym, landscaper. They spend between $300 and $2,000/month on local marketing already. They're the kind of business currently advertising in Valpak, Money Mailer, or spray-and-pray Facebook ads. Most are in the 35-60 age range and prefer tangible marketing they can hold.

The geographic market is Tonawanda, NY and surrounding Western New York. Zone 1 is ZIP 14223. Each zone is ~5,000 households reached via USPS EDDM Retail.

## What makes this different from Valpak

- **Curated:** 10 businesses per drop max, one per category, no competitors on the same piece.
- **Clean design:** One postcard, not an envelope full of 30 coupons.
- **Cheaper:** ~4-6 cents per household per advertiser vs Valpak's ~10-15 cents.
- **Smaller batches, faster turnaround:** 5,000-piece zones vs Valpak's 30,000+ territory blocks.
- **Tech-forward:** Self-serve booking, real-time spot availability, optional AI phone system upsell (Darksteel AI's Samantha voice agent) for advertisers who want more.

## Business model

- **Standard spot (front):** $297 founding, $497 regular. 8 per drop.
- **Featured spot (back hero):** $997 founding, $1,497 regular. 2 per drop.
- **Founding rates apply until zone hits 50% sold.** Hardcode this logic in the checkout.
- **Optional AI phone add-on (Samantha):** $997/month retainer. Upsell after drop 1 proves out.
- **Category exclusivity is the core promise.** Never two businesses from the same exclusivity group on the same drop.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router | Server components for read paths, server actions for writes, file-based routing. |
| Database | Supabase (Postgres + Auth + Storage) | RLS for advertiser dashboard access, storage for logo uploads, free tier covers launch. |
| Payments | Stripe Checkout (hosted) | No PCI compliance needed, test mode built in, webhook-driven state changes. |
| Styling | Tailwind CSS + CSS variables | Match the design-reference files' token system. |
| Deployment | Vercel (app) + Supabase (DB) | Both have free tiers that cover launch volume. |
| Type safety | TypeScript strict | No `any`, no unchecked access. |

## Design reference

**Read these files before designing any UI.** They define the visual system: colors, typography, component patterns, interaction behavior.

- `design-reference/brand-tokens.md` — Extracted design tokens. Start here.
- `design-reference/postcard-front-back.html` — Static postcard mockup (front + back).
- `design-reference/postcard-live-demo.html` — Interactive postcard demo with live form, category exclusivity, Valpak comparison, PNG export.
- `design-reference/landing-page-original.html` — Original Darksteel AI landing page for reference on hero-section style.

Do NOT invent new colors, fonts, or component patterns. If something isn't in the design reference, ask before introducing it.

## Current milestone

See `MILESTONES.md` for the full build plan. Current target is **Milestone 1: Zone detail page with Stripe checkout.**

## Constraints and conventions

- **No localStorage or sessionStorage** anywhere in the app. Use server-side state or React state only.
- **All writes go through API route handlers** or server actions with service-role Supabase client. Never expose the service role key to the browser.
- **RLS policies must be explicit for anon role.** Not just authenticated. Test with two separate anon clients.
- **Stripe keys are environment-flagged.** Include both `STRIPE_SECRET_KEY_TEST` and `STRIPE_SECRET_KEY_LIVE`. Add `STRIPE_MODE=test|live` to switch.
- **Webhook handlers must be idempotent.** Check if the session ID was already processed before updating state.
- **Every feature commits small.** One working thing per commit. No 500-line PRs.
- **Deploy to Vercel early.** Even broken code should be on staging by day 2.

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in Supabase and Stripe test keys
npm run dev
# In a separate terminal, for Stripe webhook testing:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## When you're confused

If something is ambiguous, ask the user before guessing. The user (Mike) has strong opinions about the design and business logic. The design-reference files are the source of truth for visual decisions. The brand-tokens.md is the source of truth for colors and typography.

If a dependency, pattern, or library isn't obviously the right choice, propose options with tradeoffs rather than picking silently.

## What this project is NOT

- Not a Valpak clone — don't suggest envelope designs, coupon book layouts, or 20+ advertiser formats.
- Not an AI agent product — that's Darksteel AI (separate). This platform is pure marketing-tech / adtech.
- Not a generic SaaS starter — don't add auth pages for a login that doesn't exist yet, don't scaffold an admin dashboard before it's in scope.
- Not multi-tenant — single operator (Mike), multiple advertisers. No organizations, no teams.
