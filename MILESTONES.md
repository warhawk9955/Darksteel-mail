# Milestones

Build order is sequential. Ship each milestone working, deployed, tested before starting the next. Do NOT work ahead.

---

## Milestone 1 — Zone detail page + Stripe checkout (current)

**Goal:** A prospect can land on `/zones/tonawanda-east`, see 8 standard + 2 featured spots with live availability, click an available spot, fill in their business info, pay via Stripe test mode, and see the spot locked immediately.

**Deliverables:**

- Supabase schema migrated with seed data (1 zone, 10 spots, 49 categories, 12 exclusivity groups)
- `/zones/[slug]` server component rendering zone + spots
- Claim flow: click spot → modal or form with (business name, email, category, offer, phone, URL, color) → Stripe Checkout redirect
- Stripe Checkout session creation in `/api/checkout/route.ts` with spot metadata
- Stripe webhook handler in `/api/webhooks/stripe/route.ts` that flips spot to `sold` on `checkout.session.completed`
- Webhook idempotency (don't reprocess same session ID)
- Cancel URL flips spot back from `pending` to `available`
- Category exclusivity enforcement: picking dental grays out orthodontist, pediatric dental, oral surgery on the same zone
- Live visual update when a spot sells (doesn't need to be real-time — page refresh is fine for v1)

**Out of scope for this milestone:**
- No advertiser dashboard
- No admin panel
- No email receipts beyond what Stripe sends automatically
- No creative upload (logo, images) — just text fields for now
- No home page, no pricing page, no other routes

**Success criteria:**
- You can run through checkout end-to-end with a Stripe test card (4242 4242 4242 4242)
- The spot state persists in Supabase
- The spot grays out after successful payment
- A second attempt to claim the same spot is blocked
- Deployed to Vercel on a staging URL

---

## Milestone 2 — Marketing surface

**Goal:** Public-facing marketing pages that convert cold traffic into zone-page visitors.

**Deliverables:**

- `/` homepage — hero, how-it-works, sample postcard preview, zone list, testimonial slot, FAQ, footer
- `/pricing` — standard vs featured tier comparison, no surprises
- `/how-it-works` — 3-step explainer for advertisers
- `/about` — one page on Darksteel Mail's founding story and coverage area
- Shared navigation and footer components
- Link to `/demo` (the interactive postcard tool, imported from design-reference)
- Mobile-responsive throughout

**Out of scope:**
- No blog
- No multi-language
- No cookie banner (US-only for now, not GDPR-critical)

---

## Milestone 3 — Live demo tool integration

**Goal:** The interactive postcard demo from `design-reference/postcard-live-demo.html` is rebuilt as a proper React component and embedded at `/demo` plus on the homepage hero.

**Deliverables:**

- `/demo` route with full-featured demo (same as the HTML reference)
- Demo component shares state with zone checkout flow — prospect customizes their ad in the demo, then clicks "Lock this in" and the data flows into checkout pre-populated
- URL parameter support: `/demo?zone=tonawanda-east&cat=dental&name=Smith+Dental` pre-fills the form
- PNG export still works (use html2canvas or equivalent)
- Valpak comparison mode

**Out of scope:**
- No logo upload in the demo yet (text fields only)
- No save-and-come-back (session-only state)

---

## Milestone 4 — Advertiser dashboard

**Goal:** After a business pays, they can log in to see their bookings and upload their creative.

**Deliverables:**

- Supabase Auth magic-link login for advertisers
- `/dashboard` — list of their bookings, status of each drop
- `/dashboard/bookings/[id]` — detail page where they upload logo, edit offer copy before approval deadline, see call stats if available
- Logo upload to Supabase Storage, served through a transform URL
- Email notifications via Resend when booking is approved for drop, when drop mails
- RLS policies tested with two separate advertiser accounts

---

## Milestone 5 — Admin tools

**Goal:** Operator (Mike) can create zones, approve creative, mark drops as mailed.

**Deliverables:**

- `/admin` route gated to a single email (hardcoded or env-based)
- Create zone: slug, name, ZIP, household count, drop date, pricing
- Approve/reject advertiser creative submissions
- Mark a drop as mailed (triggers advertiser email notifications)
- Dashboard of all zones, spots, revenue

---

## Milestones 6+ (deferred)

- Recurring advertiser subscriptions (Tier 2 from the business plan)
- Phone system integration with Samantha (Darksteel AI voice agent)
- Multi-zone support for expansion beyond Tonawanda
- Stripe Connect for payouts to referral partners
- Analytics dashboard for advertisers

Don't build these until zones 1-3 are proven.
