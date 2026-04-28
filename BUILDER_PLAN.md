# Darksteel Mail Site Builder — Plan

Single-tenant, dashboard-driven Darksteel Mail site modeled on
sites.9x12method.com. 8-step setup wizard, post-launch admin
dashboard, multiple postcard cards with customizable per-slot price
and Stripe metadata. Built on top of the existing M1 lifecycle —
nothing about claim → pending → sold changes.

This doc is the redline target. Once questions in §11 are answered,
it's frozen and Phase 1 begins.

---

## 1. Scope

In:
- 8-step wizard at `/setup` and re-editable from `/admin/site`
- Public homepage rendered entirely from `site_config`
- Multi-card support (each zone is a card; wizard creates zones)
- Per-slot price + size + position in `spots`; existing
  `/api/checkout` continues to drive Stripe Checkout Sessions
- Theme system: 17 color palettes + 6 font pairings as runtime
  CSS-variable swaps
- Lead capture form + basic page-view analytics
- Stock hero-image library + uploads via Supabase Storage
- Single admin email gated by Supabase Auth magic link

Out (deferred / rejected):
- Multi-tenant builder (`/s/[slug]` per operator)
- Free-form drag-and-drop card layouts (presets only for v1)
- Inline domain provisioning (operator connects an existing domain)
- Advertiser auth and per-advertiser dashboards (M4)
- AI phone integration, Stripe Connect, recurring subs

---

## 2. Reconciliation with the M1 schema

What stays untouched:
- `zones`, `spots`, `categories`, `exclusivity_groups` tables and the
  partial unique index `spots_zone_group_active_uidx`
- `claimPendingSpot`, `releaseSpotBySession`, `markSpotSoldBySession`
  in `lib/db/spots.ts`
- `/api/checkout/route.ts` and `/api/webhooks/stripe/route.ts`
- `sweep_stale_pending_spots()` and the cron schedule comment
- `app/checkout/success/page.tsx` and `app/checkout/cancel/route.ts`

What changes:
- `app/page.tsx` is replaced with a real homepage rendering from
  `site_config`
- `spots` gets new columns: `slot_size`, `col_position`, `row_position`,
  `col_span`, `row_span`, `face`, `founding_price_cents`,
  `regular_price_cents`. The legacy `tier` column is kept for now and
  deprecated (`slot_size` supersedes it; existing spots get a default
  mapping).
- `zones.standard_*_cents` and `zones.featured_*_cents` are kept for
  backward compat but no longer authoritative — slot-level prices win.
  `pricing.ts` reads from the slot first, falls back to zone defaults.
- `zones` gets `card_layout_id` (FK to new `card_layouts` table) and
  drop-related fields the wizard owns
- The seeded Tonawanda East zone stays as a default first card the
  wizard pre-fills (see §11.D)

---

## 3. New schema

New migration: `supabase/migrations/20260428000000_milestone_2_builder.sql`.
Do not touch the M1 init migration.

### 3.1 `site_config` — singleton

```
id                       text primary key default 'singleton'
                         check (id = 'singleton')

-- Step 1
business_name            text not null default 'Darksteel Mail'
tagline                  text

-- Step 2
city                     text
state                    text
household_count          int  default 5000
ad_spot_count_default    int  default 16
card_size_inches         text default '9×12"'
mailing_zip_codes        text[] not null default '{}'
reservation_deadline     timestamptz

-- Step 3
contact_email            text
contact_phone            text
show_email_on_site       boolean not null default true
show_phone_on_site       boolean not null default true
social_links             jsonb  not null default '{}'  -- {twitter, fb, ig, ...}

-- Step 4
theme_palette            text not null default 'midnight'
theme_font_pairing       text not null default 'modern'

-- Step 5
logo_url                 text
hero_bg_kind             text not null default 'gradient'
                         check (hero_bg_kind in ('gradient','stock','upload'))
hero_bg_url              text
portrait_url             text
favicon_url              text

-- Step 8
launched_at              timestamptz

created_at               timestamptz not null default now()
updated_at               timestamptz not null default now()
```

Updated-at trigger via the existing `set_updated_at()` function.

### 3.2 `card_layouts` — preset templates

```
id                uuid primary key default gen_random_uuid()
slug              text not null unique
name              text not null
description       text
slots_definition  jsonb not null   -- array of slot specs (size/col/row/span/face)
created_at        timestamptz not null default now()
```

Seeded rows:
- `sixteen_medium` — 16 medium slots (8 front + 8 back), default
- `eight_front_two_back_hero` — 8 standard front + 2 hero back (M1)
- `four_quadrant` — 4 large slots, 2 per side
- `mixed_premium` — mix of small/medium/large/mega

### 3.3 Columns added to `spots`

```
slot_size            text not null default 'medium'
                     check (slot_size in ('small','medium','large','mega','massive'))
col_position         int
row_position         int
col_span             int  not null default 1
row_span             int  not null default 1
face                 text not null default 'front'
                     check (face in ('front','back'))
founding_price_cents int
regular_price_cents  int
```

Backfill on migration: map each existing spot's `tier` →
- `standard` → `slot_size = 'medium'`, `face = 'front'`, prices from
  `zones.standard_*_cents`
- `featured` → `slot_size = 'large'`, `face = 'back'`, prices from
  `zones.featured_*_cents`

### 3.4 Column added to `zones`

```
card_layout_id  uuid references card_layouts(id) on delete restrict
```

Backfill: existing Tonawanda East zone → `eight_front_two_back_hero`.

### 3.5 `hero_stock_images`

```
id          uuid primary key default gen_random_uuid()
slug        text not null unique
name        text not null
url         text not null
sort_order  int  not null default 0
created_at  timestamptz not null default now()
```

Seeded with ~10 curated URLs (postcards-in-mailbox, kitchen, suburb
aerial, etc.) from a CC0 source.

### 3.6 `leads` — public form submissions

```
id             uuid primary key default gen_random_uuid()
business_name  text not null
contact_email  text not null
phone          text
message        text
source_path    text
ip_hash        text          -- sha256(salt + ip), for spam dedup, no raw IPs
created_at     timestamptz not null default now()
```

### 3.7 `page_views` — analytics

```
id           bigserial primary key
path         text not null
referrer     text
day          date not null default (now() at time zone 'utc')::date
created_at   timestamptz not null default now()
```

Index on `(day, path)`.

---

## 4. RLS

| Table              | anon select                                | anon insert        | service role |
|--------------------|--------------------------------------------|--------------------|--------------|
| site_config        | via view `site_config_public` only         | no                 | full         |
| card_layouts       | yes                                        | no                 | full         |
| hero_stock_images  | yes                                        | no                 | full         |
| spots              | existing public columns (unchanged)        | no (M1 unchanged)  | full         |
| zones              | yes (existing)                             | no                 | full         |
| leads              | no                                         | no (use API route) | full         |
| page_views         | no                                         | no (use API route) | full         |

`site_config_public` is a view exposing only fields safe for anon:
everything except `contact_email`/`contact_phone` when their respective
`show_*_on_site` flag is false. Implemented as a SQL view with `where`-
gated columns or a function; sketch in Phase 2.

---

## 5. Auth

- Supabase Auth, magic link only. No password.
- Single allowlisted admin email via env: `ADMIN_EMAIL`.
- Middleware (`middleware.ts`) intercepts `/setup/*`, `/admin/*`, and
  any `/api/admin/*` route. If the session email !== `ADMIN_EMAIL`,
  redirect to `/login`.
- The service-role key continues to be server-only via the existing
  `lib/supabase/server.ts` boundary.
- A new helper `lib/auth/admin.ts` exposes `requireAdminUser()` for use
  in API routes; throws 401 otherwise.

---

## 6. Route map

### Public
- `GET /` — homepage rendered from `site_config_public`. Sections:
  hero (logo, name, tagline, CTA, hero bg), stats strip, "Why local
  businesses love this," card lineup (one card per active zone),
  about/portrait, FAQ (static for v1), contact form, footer.
- `GET /zones/[slug]` — existing zone page, refactored to read new
  slot fields. PostcardPreview becomes layout-aware.
- `GET /checkout/success`, `GET /checkout/cancel` — unchanged.
- `GET /demo` — deferred to a later milestone (kept off this plan).

### Admin (auth-gated)
- `GET /login` — magic-link form.
- `GET /setup` — redirects to first incomplete step.
  - `/setup/name`, `/setup/campaign`, `/setup/contact`, `/setup/look`,
    `/setup/branding`, `/setup/card`, `/setup/domain`, `/setup/review`
  - Each step is a server component shell + a client form. Right side
    is a `<LivePreview />` panel that subscribes to local form state.
- `GET /admin` — KPIs (page views, unique visitors, form submissions,
  conversion rate), 7d/30d/90d/all toggle, page-views chart, recent
  leads.
- `GET /admin/site` — Site Editor. Reuses the same step components
  as `/setup` but each is independently editable.
- `GET /admin/cards` — list of zones (= cards), each with status,
  spots sold/total, drop date.
- `GET /admin/cards/[zoneId]` — edit a single card: layout preset,
  per-slot price (founding + regular), per-slot copy.
- `GET /admin/leads` — leads list, CSV export.
- `GET /admin/account` — billing/account stub.
- `GET /admin/help` — help links.

### API
- `POST /api/checkout` — unchanged.
- `POST /api/webhooks/stripe` — unchanged.
- `POST /api/leads` — public, validates with zod, hashes IP, inserts.
- `POST /api/views` — public, sendBeacon-style; rate-limited via
  in-memory counter and `ip_hash`.
- `POST /api/admin/site` — upsert `site_config`.
- `POST /api/admin/upload` — multipart, writes to Supabase Storage,
  returns the signed public URL.
- `PATCH /api/admin/cards/[zoneId]` — upsert layout + slot prices.

---

## 7. Wizard step ↔ DB mapping

| # | Step             | Fields touched                                                                                                  | Destination                                          |
|---|------------------|-----------------------------------------------------------------------------------------------------------------|------------------------------------------------------|
| 1 | Name             | business_name, tagline                                                                                          | site_config                                          |
| 2 | Campaign details | city, state, household_count, ad_spot_count_default, card_size_inches, mailing_zip_codes, reservation_deadline   | site_config + zones.drop_date when creating a card  |
| 3 | Contact          | contact_email, contact_phone, show_email_on_site, show_phone_on_site, social_links                              | site_config                                          |
| 4 | Pick your look   | theme_palette, theme_font_pairing                                                                               | site_config                                          |
| 5 | Branding         | logo_url, hero_bg_kind, hero_bg_url, portrait_url, favicon_url                                                  | site_config + Supabase Storage `branding/`, `hero/` |
| 6 | Build your card  | zones.card_layout_id, spots {slot_size, col_position, row_position, col_span, row_span, face, founding_price_cents, regular_price_cents} | zones, spots                                         |
| 7 | Domain           | none                                                                                                            | static doc page                                      |
| 8 | Review & launch  | launched_at = now()                                                                                             | site_config                                          |

---

## 8. Theme system

`lib/themes.ts` exports two constants:

```ts
export const PALETTES = {
  midnight: { primary: '#00aaff', accent: '#ff2244', surface: '#0a0a0a', ... },
  ocean:    { ... },
  emerald:  { ... },
  // 17 total
};

export const FONT_PAIRINGS = {
  modern:  { display: 'Anton', body: 'Manrope' },
  classic: { ... },
  // 6 total
};
```

`app/layout.tsx` reads `site_config.theme_palette` + `theme_font_pairing`
on the server, injects CSS variables on `<html>`. The wizard's preview
pane swaps variables locally for instant feedback before save.

The existing `brand-tokens.md` palette is the `midnight` default.

---

## 9. Storage buckets

| Bucket     | Read      | Write          | Contents                                    |
|------------|-----------|----------------|---------------------------------------------|
| `branding` | public    | service role   | logo, portrait, favicon                     |
| `hero`     | public    | service role   | uploaded hero backgrounds                   |
| `stock`    | public    | seeded once    | curated hero stock library                  |

Uploads go through `/api/admin/upload`, which authenticates the admin,
runs basic image checks (size <= 5MB, extension whitelist), then uses
the service-role client to put. The route returns the public URL,
which the wizard then writes back into `site_config`.

---

## 10. Phased build — one commit per phase

| Phase | Commit subject (proposed)                                | Touches                                                    |
|-------|----------------------------------------------------------|------------------------------------------------------------|
| 1     | feat(db): site builder schema + admin auth shell         | new migration, types regen, middleware, /login, /admin shell |
| 2     | feat(home): render homepage from site_config             | /, site_config_public view, /api/admin/site, theme tokens   |
| 3     | feat(setup): wizard steps 1–5 with live preview          | /setup/*, /api/admin/upload, shared step components         |
| 4     | feat(cards): card builder + per-slot pricing             | /setup/card, /admin/cards/*, spots refactor, /api/checkout reads new prices, zone page render |
| 5     | feat(setup): domain docs + review/launch                 | /setup/domain, /setup/review, launched_at flip              |
| 6     | feat(admin): leads + page-view analytics                 | /api/leads, /api/views, /admin KPIs, /admin/leads           |
| 7     | chore: mobile + seo + favicon polish                     | layout.tsx, head metadata, responsive sweep                 |

After each phase: `npm run typecheck`, `npm run db:types` if migration
touched, manual smoke test, commit. No phase ships without M1 still
working end-to-end (4242 4242 4242 4242 → spot sold).

---

## 11. Open questions — answer to freeze the plan

**A. Multiple cards.** Confirm: "multiple cards" = "multiple zones,"
each zone is one postcard, the homepage lineup section lists every
active zone. Cards are not first-class independent of zones in v1.
(Yes / No / Different model)

**B. Founding-rate logic.** Keep the founding-rate gate (per-slot
`founding_price_cents` + `regular_price_cents` flipping at
`zones.founding_threshold`), or collapse to one price per slot for v1
and revisit later? (Keep / Collapse)

**C. Hero stock library.** Build a curated list of ~10 CC0 images
seeded into `hero_stock_images`, or upload-only for v1? (Curated /
Upload-only)

**D. Seeded zone.** Keep the existing Tonawanda East seed as the
wizard's default first card pre-fill, or start empty so the operator
creates the first zone manually in the wizard? (Keep / Empty)

**E. Pre-launch behavior.** Before `launched_at` is set, does `/`
show an "Almost ready" splash, redirect anonymous users to a
coming-soon page, or stay inaccessible (404)? (Splash / Redirect /
404)

**F. Analytics depth.** Page views + leads + conversion rate is
enough for v1. Confirm we are not adding session tracking, funnel,
or referrer attribution beyond raw `referrer` storage. (Confirmed /
Want more)
