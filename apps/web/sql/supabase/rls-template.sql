-- Supabase Row Level Security — OPTIONAL templates when using Supabase Auth + direct PostgREST.
-- The Next.js app uses Prisma with DATABASE_URL (often service role) and bypasses RLS.
-- Enable these only if you expose tables to anon/authenticated clients via Supabase Data API.

-- Example: legacy Property table (adjust UUID vs text to match your column types)
-- ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "property_select_own" ON "Property" FOR SELECT USING ("ownerId" = auth.uid()::text);

-- FSBO listings: owners read own rows
-- ALTER TABLE fsbo_listings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "fsbo_select_own" ON fsbo_listings FOR SELECT USING (owner_id = auth.uid()::text);

-- Never expose verification_signals raw to anon without sanitization policies.
