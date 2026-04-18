-- =====================================================================
-- Darksteel Mail — Milestone 1 schema
-- One zone (Tonawanda East, ZIP 14223), 10 spots,
-- 49 categories in 12 exclusivity groups.
-- =====================================================================

-- Extensions
create extension if not exists "pgcrypto";
-- pg_cron is enabled from the Supabase dashboard (Database → Extensions).
-- The schedule call at the bottom of this file is commented out until it is.

-- =====================================================================
-- ENUMS
-- =====================================================================

create type spot_tier   as enum ('standard', 'featured');
create type spot_status as enum ('available', 'pending', 'sold');

-- =====================================================================
-- TABLES
-- =====================================================================

create table exclusivity_groups (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

create table categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  group_id      uuid not null references exclusivity_groups(id) on delete restrict,
  default_offer text,
  default_sub   text,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now()
);

create index categories_group_idx on categories(group_id);

create table zones (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  name                    text not null,
  zip                     text not null,
  household_count         int  not null,
  drop_date               date not null,
  founding_threshold      numeric(4,3) not null default 0.500,  -- founding rate until this sold-fraction
  standard_founding_cents int  not null,
  standard_regular_cents  int  not null,
  featured_founding_cents int  not null,
  featured_regular_cents  int  not null,
  created_at              timestamptz not null default now()
);

create table spots (
  id                uuid primary key default gen_random_uuid(),
  zone_id           uuid not null references zones(id) on delete restrict,
  position          int  not null check (position between 1 and 10),
  tier              spot_tier   not null,
  status            spot_status not null default 'available',

  -- claim fields (null when available)
  category_id       uuid references categories(id) on delete restrict,
  group_id          uuid references exclusivity_groups(id),
  business_name     text,
  contact_email     text,
  offer             text,
  phone             text,
  url               text,
  accent_color      text,

  -- payment lifecycle
  stripe_session_id text unique,
  pending_at        timestamptz,
  sold_at           timestamptz,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (zone_id, position),

  -- a claimed spot has everything it needs
  constraint claimed_has_fields check (
    status = 'available'
    or (category_id is not null
        and business_name is not null
        and contact_email is not null
        and stripe_session_id is not null)
  )
);

create index spots_zone_status_idx    on spots (zone_id, status);
create index spots_zone_category_idx  on spots (zone_id, category_id) where category_id is not null;
create index spots_pending_sweep_idx  on spots (pending_at)             where status = 'pending';
create index spots_stripe_session_idx on spots (stripe_session_id)      where stripe_session_id is not null;

-- Only one active (pending or sold) claim per (zone, group).
-- Pending-group collisions fail deterministically at the DB.
create unique index spots_zone_group_active_uidx
  on spots (zone_id, group_id)
  where group_id is not null and status in ('pending', 'sold');

-- =====================================================================
-- TRIGGERS
-- =====================================================================

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger spots_set_updated_at
  before update on spots
  for each row execute function set_updated_at();

-- Keep spots.group_id in sync with the chosen category's group.
create or replace function spots_sync_group_id() returns trigger
language plpgsql as $$
begin
  if new.category_id is null then
    new.group_id := null;
  else
    select group_id into new.group_id from categories where id = new.category_id;
  end if;
  return new;
end $$;

create trigger spots_sync_group_id_biu
  before insert or update of category_id on spots
  for each row execute function spots_sync_group_id();

-- =====================================================================
-- PENDING SWEEP — 30-minute stale claim recovery
-- =====================================================================

create or replace function sweep_stale_pending_spots()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update spots
     set status            = 'available',
         category_id       = null,
         business_name     = null,
         contact_email     = null,
         offer             = null,
         phone             = null,
         url               = null,
         accent_color      = null,
         stripe_session_id = null,
         pending_at        = null
   where status = 'pending'
     and pending_at < now() - interval '30 minutes';
  get diagnostics n = row_count;
  return n;
end $$;

-- After enabling pg_cron in the Supabase dashboard, run:
--   select cron.schedule('sweep-stale-pending', '*/5 * * * *',
--                        $$select public.sweep_stale_pending_spots()$$);

-- =====================================================================
-- RLS — anon reads; all writes go through service-role only.
-- No authenticated policies in M1 (no advertiser dashboard yet).
-- =====================================================================

alter table zones              enable row level security;
alter table exclusivity_groups enable row level security;
alter table categories         enable row level security;
alter table spots              enable row level security;

create policy "zones: anon read"
  on zones for select to anon using (true);

create policy "exclusivity_groups: anon read"
  on exclusivity_groups for select to anon using (true);

create policy "categories: anon read"
  on categories for select to anon using (true);

create policy "spots: anon read"
  on spots for select to anon using (true);

-- No INSERT/UPDATE/DELETE policies for anon => blocked by RLS.

-- =====================================================================
-- SEED DATA
-- =====================================================================

-- 12 exclusivity groups
insert into exclusivity_groups (slug, name) values
  ('dental',        'Dental'),
  ('home_exterior', 'Home Exterior'),
  ('home_interior', 'Home Interior'),
  ('hvac_plumbing', 'HVAC & Plumbing'),
  ('home_services', 'Home Services'),
  ('auto',          'Automotive'),
  ('beauty',        'Beauty & Personal Care'),
  ('fitness',       'Fitness'),
  ('food',          'Food & Beverage'),
  ('pets',          'Pets'),
  ('professional',  'Professional Services'),
  ('health',        'Health & Wellness');

-- 49 categories
insert into categories (slug, name, group_id, default_offer, default_sub, sort_order)
select c.slug, c.name, g.id, c.default_offer, c.default_sub, c.sort_order
from (values
  -- dental
  ('dental_general',    'General Dentistry',   'dental',        '$79 new-patient exam',   'Cleaning · exam · x-rays',        10),
  ('dental_cosmetic',   'Cosmetic Dentistry',  'dental',        'Free whitening consult', 'Veneers · whitening · bonding',   11),
  ('dental_pediatric',  'Pediatric Dentistry', 'dental',        '$49 first kids visit',   'Kids · exams · sealants',         12),
  ('orthodontics',      'Orthodontics',        'dental',        '$500 off braces',        'Braces · Invisalign · retainers', 13),
  ('oral_surgery',      'Oral Surgery',        'dental',        'Free implant consult',   'Implants · extractions · wisdom', 14),

  -- home_exterior
  ('roofing',           'Roofing',             'home_exterior', 'Free roof inspection',   'Roofs · storm · repair',          20),
  ('siding',            'Siding',              'home_exterior', 'Free siding quote',      'Vinyl · fiber cement · wrap',     21),
  ('gutters',           'Gutters',             'home_exterior', '15% off seamless gutter','Install · repair · guards',       22),
  ('windows',           'Windows',             'home_exterior', '$250 off per window',    'Replacement · energy · vinyl',    23),
  ('masonry',           'Masonry',             'home_exterior', 'Free masonry estimate',  'Brick · stone · chimney',         24),

  -- home_interior
  ('kitchen_remodel',   'Kitchen Remodeling',  'home_interior', 'Free design consult',    'Cabinets · counters · layout',    30),
  ('bath_remodel',      'Bath Remodeling',     'home_interior', 'Free bath consult',      'Tile · vanity · shower',          31),
  ('flooring',          'Flooring',            'home_interior', '10% off install',        'Hardwood · tile · LVP',           32),
  ('painting',          'Painting',            'home_interior', 'Free paint estimate',    'Interior · exterior · cabinets',  33),

  -- hvac_plumbing
  ('hvac',              'HVAC',                'hvac_plumbing', '$49 tune-up',            'Heating · cooling · service',     40),
  ('plumbing',          'Plumbing',            'hvac_plumbing', '$29 service call',       'Repair · drains · water heaters', 41),

  -- home_services
  ('landscaping',       'Landscaping',         'home_services', '15% off first service',  'Design · install · mulch',        50),
  ('lawn_care',         'Lawn Care',           'home_services', 'Free first mow',         'Mowing · fertilizer · edging',    51),
  ('tree_service',      'Tree Service',        'home_services', 'Free tree estimate',     'Removal · trimming · stump',      52),
  ('pest_control',      'Pest Control',        'home_services', '$50 off quarterly plan', 'Ants · rodents · termites',       53),
  ('cleaning',          'House Cleaning',      'home_services', '$50 off first clean',    'Weekly · biweekly · deep',        54),

  -- auto
  ('auto_repair',       'Auto Repair',         'auto',          '$29 oil change',         'Repair · diagnostics · brakes',   60),
  ('body_shop',         'Auto Body',           'auto',          '$100 off deductible',    'Collision · paint · dent',        61),
  ('tires',             'Tire Shop',           'auto',          '$75 off set of 4',       'Tires · alignment · balance',     62),
  ('auto_detail',       'Auto Detail',         'auto',          '$49 express detail',     'Wash · interior · ceramic',       63),

  -- beauty
  ('med_spa',           'Med Spa',             'beauty',        '$9/unit Botox',          'Botox · filler · laser',          70),
  ('salon',             'Hair Salon',          'beauty',        '20% off first visit',    'Cut · color · style',             71),
  ('barber',            'Barber Shop',         'beauty',        '$5 off first cut',       'Cuts · shaves · beard',           72),
  ('nail_salon',        'Nail Salon',          'beauty',        '$10 off first mani-pedi','Manicure · pedicure · gel',       73),
  ('lash_brow',         'Lash & Brow',         'beauty',        '$25 off first lash fill','Lashes · brows · tint',           74),

  -- fitness
  ('gym',               'Gym / Fitness',       'fitness',       '$0 enrollment',          'Equipment · classes · trainers',  80),
  ('yoga',              'Yoga Studio',         'fitness',       'First class free',       'Vinyasa · hot · restorative',     81),
  ('martial_arts',      'Martial Arts',        'fitness',       'Free trial week',        'Kids · adults · BJJ',             82),

  -- food
  ('pizza',             'Pizza',               'food',          'Large pie $12.99',       'Brick-oven · wings · sides',      90),
  ('restaurant',        'Restaurant',          'food',          '$10 off $40 check',      'Dine-in · takeout · catering',    91),
  ('catering',          'Catering',            'food',          '10% off events $500+',   'Events · corporate · weddings',   92),
  ('bakery',            'Bakery',              'food',          'Free dozen w/ cake',     'Cakes · pastries · custom',       93),
  ('coffee',            'Coffee Shop',         'food',          'Free drink on 5th',      'Espresso · pastry · roast',       94),

  -- pets
  ('vet',               'Veterinary',          'pets',          '$39 wellness exam',      'Wellness · dental · surgery',    100),
  ('grooming',          'Pet Grooming',        'pets',          '15% off first groom',    'Bath · cut · nails',             101),
  ('boarding',          'Pet Boarding',        'pets',          '$20 off first stay',     'Boarding · daycare · training',  102),

  -- professional
  ('real_estate',       'Real Estate',         'professional',  'Free home valuation',    'Residential · commercial · rent',110),
  ('insurance',         'Insurance',           'professional',  'Free quote · save 20%',  'Auto · home · life',             111),
  ('attorney',          'Attorney',            'professional',  'Free consult',           'Estate · family · injury',       112),
  ('accountant',        'Accountant / Tax',    'professional',  'Free tax review',        'Tax · bookkeeping · payroll',    113),
  ('financial_advisor', 'Financial Advisor',   'professional',  'Free portfolio review',  'Planning · retirement · invest', 114),

  -- health
  ('chiropractor',      'Chiropractor',        'health',        '$49 new-patient exam',   'Adjustments · decomp · massage', 120),
  ('physical_therapy',  'Physical Therapy',    'health',        'Free screening',         'Injury · post-op · sports',      121),
  ('optometry',         'Optometry',           'health',        '$50 off frames',         'Exams · glasses · contacts',     122)
) as c(slug, name, group_slug, default_offer, default_sub, sort_order)
join exclusivity_groups g on g.slug = c.group_slug;

-- Zone 1: Tonawanda East, ZIP 14223
insert into zones (
  slug, name, zip, household_count, drop_date,
  founding_threshold,
  standard_founding_cents, standard_regular_cents,
  featured_founding_cents, featured_regular_cents
) values (
  'tonawanda-east', 'Tonawanda East', '14223', 5000, '2026-05-15',
  0.500,
  29700,  49700,
  99700, 149700
);

-- 10 spots for Zone 1: positions 1-8 standard, 9-10 featured
insert into spots (zone_id, position, tier)
select z.id, p.position, p.tier::spot_tier
from zones z,
     (values
       (1, 'standard'), (2, 'standard'), (3, 'standard'), (4, 'standard'),
       (5, 'standard'), (6, 'standard'), (7, 'standard'), (8, 'standard'),
       (9, 'featured'), (10, 'featured')
     ) as p(position, tier)
where z.slug = 'tonawanda-east';
