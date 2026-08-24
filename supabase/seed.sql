-- Optional LOCAL development data. This file is not applied by `supabase db push`.
-- Every inserted listing is explicitly marked is_demo=true so the UI labels it.
select public.rotate_weekly_season(now());

insert into public.listings (
  slug, name, tagline, description, website_url, normalized_url,
  founder_name, founder_x_handle, category, launch_year, status,
  current_season_id, is_demo, approved_at
)
select
  seed.slug, seed.name, seed.tagline,
  'Local demonstration listing. Remove with `supabase db reset` before using real test data.',
  seed.url, seed.url, 'Demo Founder', seed.handle, seed.category, 2026,
  'approved'::public.listing_status, season.id, true, now()
from (
  values
    ('northstar-demo', 'Northstar Demo', 'A local-only flag for testing the mountain.', 'https://example.com/northstar', '@northstardemo', 'AI'),
    ('fjord-demo', 'Fjord Demo', 'Local development data for Base Camp.', 'https://example.com/fjord', '@fjorddemo', 'Developer tools'),
    ('lantern-demo', 'Lantern Demo', 'Never installed by a production migration.', 'https://example.com/lantern', '@lanterndemo', 'Productivity')
) as seed(slug, name, tagline, url, handle, category)
cross join lateral (select id from public.seasons where status = 'active' limit 1) season
on conflict (slug) do nothing;
