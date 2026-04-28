-- =====================================================================
-- Storage buckets used by the wizard's branding step.
-- Service-role uploads bypass RLS; bucket is public-readable so the
-- public site can <img src=...> the resulting URLs without signing.
-- =====================================================================

insert into storage.buckets (id, name, public) values
  ('branding', 'branding', true),
  ('hero',     'hero',     true)
on conflict (id) do nothing;
