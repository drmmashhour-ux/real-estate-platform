# Supabase guest booking integrity (`validate:platform`)

`validateGuestSupabaseBookingsIntegrity` needs a **service-role** client to read the `bookings` table in your Supabase project (BNHub guest bridge).

## Required (apps/web `.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_jwt
```

Copy from `apps/web/supabase-env.local.example`. Restart the app / validation after changing env.

## Outcome

- **Configured:** integrity runs; `dataIntegrity.ok` reflects real findings (or `ok: true` if no issues).
- **Missing:** integrity reports `SUPABASE_UNAVAILABLE`; launch decision stays **GO_WITH_WARNINGS** with `data_integrity:supabase_not_configured_skipped` (not a blocker).

No code paths auto-create secrets; this is intentional.
