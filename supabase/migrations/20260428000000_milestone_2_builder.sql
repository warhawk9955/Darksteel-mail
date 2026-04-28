-- =====================================================================
-- Darksteel Mail — Milestone 2 schema (site builder + admin shell)
-- - site_config singleton
-- - card_layouts presets (seeded)
-- - hero_stock_images library (empty; seeded later)
-- - leads, page_views
-- - new columns on spots (slot_size, position fields, per-slot prices)
-- - new column on zones (card_layout_id)
-- - site_config_public view masking sensitive fields by show_*_on_site
-- =====================================================================

-- =====================================================================
-- card_layouts — preset templates
-- =====================================================================

create table card_layouts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  name             text not null,
  description      text,
  -- Each entry in slots_definition is a slot spec the wizard will use
  -- to fan out into rows of `spots` for a zone bound to this layout:
  --   { position, slot_size, face, col_position, row_position,
  --     col_span, row_span }
  slots_definition jsonb not null,
  created_at       timestamptz not null default now()
);

-- =====================================================================
-- hero_stock_images — curated library, populated later
-- =====================================================================

create table hero_stock_images (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  url        text not null,
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

create index hero_stock_images_sort_idx on hero_stock_images(sort_order);

-- =====================================================================
-- site_config — singleton row, edited by the wizard / admin
-- =====================================================================

create table site_config (
  id                    text primary key default 'singleton'
                        check (id = 'singleton'),

  -- Step 1: Name
  business_name         text not null default 'Darksteel Mail',
  tagline               text,

  -- Step 2: Campaign details
  city                  text,
  state                 text,
  household_count       int  default 5000,
  ad_spot_count_default int  default 16,
  card_size_inches      text default '9×12"',
  mailing_zip_codes     text[] not null default '{}',
  reservation_deadline  timestamptz,

  -- Step 3: Contact
  contact_email         text,
  contact_phone         text,
  show_email_on_site    boolean not null default true,
  show_phone_on_site    boolean not null default true,
  social_links          jsonb   not null default '{}'::jsonb,

  -- Step 4: Look
  theme_palette         text not null default 'midnight',
  theme_font_pairing    text not null default 'modern',

  -- Step 5: Branding
  logo_url              text,
  hero_bg_kind          text not null default 'gradient'
                        check (hero_bg_kind in ('gradient','stock','upload')),
  hero_bg_url           text,
  portrait_url          text,
  favicon_url           text,

  -- Step 8: Launch
  launched_at           timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger site_config_set_updated_at
  before update on site_config
  for each row execute function set_updated_at();

-- Singleton seed
insert into site_config (id) values ('singleton')
on conflict (id) do nothing;

-- =====================================================================
-- spots — new columns + backfill
-- =====================================================================

alter table spots
  add column slot_size text not null default 'medium'
    check (slot_size in ('small','medium','large','mega','massive')),
  add column col_position int,
  add column row_position int,
  add column col_span int not null default 1,
  add column row_span int not null default 1,
  add column face text not null default 'front'
    check (face in ('front','back')),
  add column founding_price_cents int,
  add column regular_price_cents  int,
  add column card_layout_id uuid references card_layouts(id) on delete restrict;

-- Backfill from legacy tier + zone-level pricing.
-- Standard spots: 4-col x 2-row front grid (positions 1..8).
update spots
   set col_position = ((position - 1) % 4) + 1,
       row_position = ((position - 1) / 4) + 1,
       slot_size    = 'medium',
       face         = 'front'
 where tier = 'standard';

-- Featured spots: 2 hero slots on the back, each spanning 2 cols.
update spots
   set col_position = case position when 9 then 1 else 3 end,
       row_position = 1,
       slot_size    = 'large',
       col_span     = 2,
       face         = 'back'
 where tier = 'featured';

-- Per-slot prices copied from zone defaults at the time of migration.
update spots s
   set founding_price_cents = z.standard_founding_cents,
       regular_price_cents  = z.standard_regular_cents
  from zones z
 where s.zone_id = z.id and s.tier = 'standard';

update spots s
   set founding_price_cents = z.featured_founding_cents,
       regular_price_cents  = z.featured_regular_cents
  from zones z
 where s.zone_id = z.id and s.tier = 'featured';

-- =====================================================================
-- zones — bind to a card_layout
-- =====================================================================

alter table zones
  add column card_layout_id uuid references card_layouts(id) on delete restrict;

-- =====================================================================
-- card_layouts — seed the presets
-- =====================================================================

insert into card_layouts (slug, name, description, slots_definition) values
  ('eight_front_two_back_hero',
   'M1 Classic — 8 front + 2 hero back',
   'Eight medium standard slots on the front, two large hero slots on the back. Original Darksteel Mail layout.',
   $json$[
     {"position":1,"slot_size":"medium","face":"front","col_position":1,"row_position":1,"col_span":1,"row_span":1},
     {"position":2,"slot_size":"medium","face":"front","col_position":2,"row_position":1,"col_span":1,"row_span":1},
     {"position":3,"slot_size":"medium","face":"front","col_position":3,"row_position":1,"col_span":1,"row_span":1},
     {"position":4,"slot_size":"medium","face":"front","col_position":4,"row_position":1,"col_span":1,"row_span":1},
     {"position":5,"slot_size":"medium","face":"front","col_position":1,"row_position":2,"col_span":1,"row_span":1},
     {"position":6,"slot_size":"medium","face":"front","col_position":2,"row_position":2,"col_span":1,"row_span":1},
     {"position":7,"slot_size":"medium","face":"front","col_position":3,"row_position":2,"col_span":1,"row_span":1},
     {"position":8,"slot_size":"medium","face":"front","col_position":4,"row_position":2,"col_span":1,"row_span":1},
     {"position":9,"slot_size":"large","face":"back","col_position":1,"row_position":1,"col_span":2,"row_span":1},
     {"position":10,"slot_size":"large","face":"back","col_position":3,"row_position":1,"col_span":2,"row_span":1}
   ]$json$::jsonb),

  ('sixteen_medium',
   'Sixteen Medium — 8 front + 8 back',
   'Standard 9x12 layout: sixteen medium slots, evenly split front and back. Default if you skip the card builder.',
   $json$[
     {"position":1,"slot_size":"medium","face":"front","col_position":1,"row_position":1,"col_span":1,"row_span":1},
     {"position":2,"slot_size":"medium","face":"front","col_position":2,"row_position":1,"col_span":1,"row_span":1},
     {"position":3,"slot_size":"medium","face":"front","col_position":3,"row_position":1,"col_span":1,"row_span":1},
     {"position":4,"slot_size":"medium","face":"front","col_position":4,"row_position":1,"col_span":1,"row_span":1},
     {"position":5,"slot_size":"medium","face":"front","col_position":1,"row_position":2,"col_span":1,"row_span":1},
     {"position":6,"slot_size":"medium","face":"front","col_position":2,"row_position":2,"col_span":1,"row_span":1},
     {"position":7,"slot_size":"medium","face":"front","col_position":3,"row_position":2,"col_span":1,"row_span":1},
     {"position":8,"slot_size":"medium","face":"front","col_position":4,"row_position":2,"col_span":1,"row_span":1},
     {"position":9,"slot_size":"medium","face":"back","col_position":1,"row_position":1,"col_span":1,"row_span":1},
     {"position":10,"slot_size":"medium","face":"back","col_position":2,"row_position":1,"col_span":1,"row_span":1},
     {"position":11,"slot_size":"medium","face":"back","col_position":3,"row_position":1,"col_span":1,"row_span":1},
     {"position":12,"slot_size":"medium","face":"back","col_position":4,"row_position":1,"col_span":1,"row_span":1},
     {"position":13,"slot_size":"medium","face":"back","col_position":1,"row_position":2,"col_span":1,"row_span":1},
     {"position":14,"slot_size":"medium","face":"back","col_position":2,"row_position":2,"col_span":1,"row_span":1},
     {"position":15,"slot_size":"medium","face":"back","col_position":3,"row_position":2,"col_span":1,"row_span":1},
     {"position":16,"slot_size":"medium","face":"back","col_position":4,"row_position":2,"col_span":1,"row_span":1}
   ]$json$::jsonb),

  ('four_quadrant',
   'Four Quadrant — 4 large slots',
   'Four large hero slots, two per side. Premium-only configuration.',
   $json$[
     {"position":1,"slot_size":"large","face":"front","col_position":1,"row_position":1,"col_span":2,"row_span":1},
     {"position":2,"slot_size":"large","face":"front","col_position":3,"row_position":1,"col_span":2,"row_span":1},
     {"position":3,"slot_size":"large","face":"back","col_position":1,"row_position":1,"col_span":2,"row_span":1},
     {"position":4,"slot_size":"large","face":"back","col_position":3,"row_position":1,"col_span":2,"row_span":1}
   ]$json$::jsonb),

  ('mixed_premium',
   'Mixed Premium — small/medium/large mix',
   'A heterogeneous layout for testing the slot-size variety: small on front edges, medium center, two large on back.',
   $json$[
     {"position":1,"slot_size":"small","face":"front","col_position":1,"row_position":1,"col_span":1,"row_span":1},
     {"position":2,"slot_size":"medium","face":"front","col_position":2,"row_position":1,"col_span":2,"row_span":1},
     {"position":3,"slot_size":"small","face":"front","col_position":4,"row_position":1,"col_span":1,"row_span":1},
     {"position":4,"slot_size":"medium","face":"front","col_position":1,"row_position":2,"col_span":2,"row_span":1},
     {"position":5,"slot_size":"medium","face":"front","col_position":3,"row_position":2,"col_span":2,"row_span":1},
     {"position":6,"slot_size":"large","face":"back","col_position":1,"row_position":1,"col_span":2,"row_span":1},
     {"position":7,"slot_size":"large","face":"back","col_position":3,"row_position":1,"col_span":2,"row_span":1}
   ]$json$::jsonb);

-- Bind the seeded Tonawanda East zone to the M1-equivalent layout, and
-- copy the layout id down to its existing spots so the legacy zone
-- continues to render correctly through the new path.
update zones
   set card_layout_id = (select id from card_layouts where slug = 'eight_front_two_back_hero')
 where slug = 'tonawanda-east';

update spots s
   set card_layout_id = z.card_layout_id
  from zones z
 where s.zone_id = z.id and z.card_layout_id is not null;

-- =====================================================================
-- leads — public form submissions
-- =====================================================================

create table leads (
  id            uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_email text not null,
  phone         text,
  message       text,
  source_path   text,
  ip_hash       text,
  created_at    timestamptz not null default now()
);

create index leads_created_idx on leads(created_at desc);

-- =====================================================================
-- page_views — basic analytics
-- =====================================================================

create table page_views (
  id         bigserial primary key,
  path       text not null,
  referrer   text,
  day        date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now()
);

create index page_views_day_path_idx on page_views(day, path);

-- =====================================================================
-- site_config_public view — masks sensitive fields per show_*_on_site
-- =====================================================================
-- The view is created with the default security model (definer-style),
-- which means it runs with the creator's privileges and bypasses RLS
-- on site_config. That is intentional: the view IS the safe public
-- read API, and the underlying table has no anon SELECT policy so
-- direct table reads are blocked.

create or replace view site_config_public as
select
  id,
  business_name,
  tagline,
  city,
  state,
  household_count,
  ad_spot_count_default,
  card_size_inches,
  mailing_zip_codes,
  reservation_deadline,
  case when show_email_on_site then contact_email else null end as contact_email,
  case when show_phone_on_site then contact_phone else null end as contact_phone,
  show_email_on_site,
  show_phone_on_site,
  social_links,
  theme_palette,
  theme_font_pairing,
  logo_url,
  hero_bg_kind,
  hero_bg_url,
  portrait_url,
  favicon_url,
  launched_at
from site_config;

grant select on site_config_public to anon;

-- =====================================================================
-- RLS — anon reads on public-safe tables/views; everything else blocked
-- =====================================================================

alter table site_config       enable row level security;
alter table card_layouts      enable row level security;
alter table hero_stock_images enable row level security;
alter table leads             enable row level security;
alter table page_views        enable row level security;

create policy "card_layouts: anon read"
  on card_layouts for select to anon using (true);

create policy "hero_stock_images: anon read"
  on hero_stock_images for select to anon using (true);

-- site_config: NO anon policy. Anon must go through site_config_public.
-- leads, page_views: NO anon policy. Inserts go through service-role
-- API routes that do their own validation + rate limiting.
