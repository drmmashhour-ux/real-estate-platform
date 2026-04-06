-- Soft-launch demo inventory: 15 BNHub listings (price, description, cover image).
-- Run in Supabase SQL editor AFTER:
--   apps/mobile/docs/supabase-listings.sql
--   apps/mobile/docs/supabase-listings-marketplace-extensions.sql (optional)
--   apps/mobile/docs/supabase-rpc-create-guest-booking.sql
--
-- Idempotent: fixed UUIDs — re-run updates copy and pricing.
-- Host dashboard: assign your Supabase Auth user to rows you manage:
--   UPDATE public.listings SET host_user_id = '<your-supabase-auth-uuid>' WHERE id::text LIKE 'b1111111-%';

insert into public.listings (
  id, title, description, city, price_per_night, cover_image_url, host_user_id
) values
  ('b1111111-1111-4111-8111-111111111101', 'Loft overlooking Old Port', 'Bright loft with full kitchen, fast Wi‑Fi, and walkable cafés. Ideal for a long weekend in the old city.', 'Montreal', 129.00, 'https://picsum.photos/seed/bnhub-mtl-1/1200/800', null),
  ('b1111111-1111-4111-8111-111111111102', 'Plateau studio — quiet lane', 'Compact studio steps from Mont-Royal. Self check-in, washer in building, workspace nook.', 'Montreal', 89.00, 'https://picsum.photos/seed/bnhub-mtl-2/1200/800', null),
  ('b1111111-1111-4111-8111-111111111103', 'Griffintown 2BR family stay', 'Two bedrooms, two baths, balcony, and underground parking. Family-friendly kitchen.', 'Montreal', 189.00, 'https://picsum.photos/seed/bnhub-mtl-3/1200/800', null),
  ('b1111111-1111-4111-8111-111111111104', 'Downtown high-floor sunset', 'Corner unit with skyline views, gym access, and 24h concierge.', 'Montreal', 219.00, 'https://picsum.photos/seed/bnhub-mtl-4/1200/800', null),
  ('b1111111-1111-4111-8111-111111111105', 'Mile End creative flat', 'Exposed brick, vinyl corner, and a proper dining table for remote work weeks.', 'Montreal', 149.00, 'https://picsum.photos/seed/bnhub-mtl-5/1200/800', null),
  ('b1111111-1111-4111-8111-111111111106', 'King West designer 1BR', 'Floor-to-ceiling windows, king bed, and a walk score that actually delivers.', 'Toronto', 199.00, 'https://picsum.photos/seed/bnhub-to-1/1200/800', null),
  ('b1111111-1111-4111-8111-111111111107', 'Leslieville rowhouse guest suite', 'Private entrance, patio, and espresso machine. 15 min to core on transit.', 'Toronto', 159.00, 'https://picsum.photos/seed/bnhub-to-2/1200/800', null),
  ('b1111111-1111-4111-8111-111111111108', 'Harbourfront calm 1BR', 'Water views, blackout shades, and a dedicated desk for focused stays.', 'Toronto', 229.00, 'https://picsum.photos/seed/bnhub-to-3/1200/800', null),
  ('b1111111-1111-4111-8111-111111111109', 'Yorkville walk-everywhere studio', 'Premium linens, rain shower, steps from galleries and dining.', 'Toronto', 249.00, 'https://picsum.photos/seed/bnhub-to-4/1200/800', null),
  ('b1111111-1111-4111-8111-111111111110', 'Kensington market attic nest', 'Skylights, vintage touches, and the best tacos in town downstairs.', 'Toronto', 119.00, 'https://picsum.photos/seed/bnhub-to-5/1200/800', null),
  ('b1111111-1111-4111-8111-111111111111', 'Gastown brick & beam', 'Historic beams, modern bath, and cocktail bars on the same block.', 'Vancouver', 209.00, 'https://picsum.photos/seed/bnhub-van-1/1200/800', null),
  ('b1111111-1111-4111-8111-111111111112', 'Kits beach walk-up 2BR', 'Sandy sunsets, bike storage, and a full kitchen for longer stays.', 'Vancouver', 189.00, 'https://picsum.photos/seed/bnhub-van-2/1200/800', null),
  ('b1111111-1111-4111-8111-111111111113', 'False Creek calm corner', 'Water taxi steps away, quiet bedroom, and fast fiber.', 'Vancouver', 219.00, 'https://picsum.photos/seed/bnhub-van-3/1200/800', null),
  ('b1111111-1111-4111-8111-111111111114', 'Mount Pleasant laneway home', 'Patio fire pit, EV charger, and room for two remote workers.', 'Vancouver', 239.00, 'https://picsum.photos/seed/bnhub-van-4/1200/800', null),
  ('b1111111-1111-4111-8111-111111111115', 'Richmond skytrain studio', 'Airport-friendly, soundproof windows, and 24h gym in tower.', 'Richmond', 99.00, 'https://picsum.photos/seed/bnhub-van-5/1200/800', null)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  city = excluded.city,
  price_per_night = excluded.price_per_night,
  cover_image_url = excluded.cover_image_url;

-- Refresh gallery rows for seed listings (safe re-run).
delete from public.listing_images where listing_id::text like 'b1111111-%';

insert into public.listing_images (listing_id, url, sort_order)
select id, cover_image_url, 0 from public.listings where id::text like 'b1111111-%';

insert into public.listing_images (listing_id, url, sort_order)
select id, 'https://picsum.photos/seed/bnhub-gallery-' || substr(replace(id::text, '-', ''), 1, 12) || '/1200/800', 1
from public.listings where id::text like 'b1111111-%';
