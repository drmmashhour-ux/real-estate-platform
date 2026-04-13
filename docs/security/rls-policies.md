# Row Level Security (RLS) and Prisma

## Reality in this repo

The **web app uses Prisma** with a **direct PostgreSQL connection string** (`DATABASE_URL`). In this mode:

- Connections typically use a **database role that bypasses RLS** (e.g. owner or `SUPERUSER`-equivalent privileges), so **Postgres RLS policies are not enforced** for application queries unless you deliberately use a restricted role and set `SET ROLE` or connect as a limited user.

Therefore **primary access control is in application code**: middleware, route handlers, and Prisma `where` clauses that scope by `userId`, `ownerId`, membership tables, etc.

## When RLS matters

If you expose **Supabase** to clients (e.g. `anon` key + Supabase JS) **against the same tables**, you **must** enable RLS on those tables and write policies:

| Principle | Policy intent |
|-----------|----------------|
| **Users** | A user reads/updates only their `User` row or fields allowed publicly. |
| **Listings** | Public read for published listings only; write for owner/host. |
| **Bookings** | Guest and host (and platform ops) see only relevant rows. |
| **Messages** | Participants in thread only. |
| **Payments** | Owner of payment row; no cross-user reads. |
| **Broker CRM** | Broker sees assigned/owned leads only. |
| **Deal rooms / legal** | Explicit participant membership. |
| **Admin intelligence** | Service role only — never `anon`. |

## Documenting policies

When you add RLS in Supabase SQL Editor or migrations, **append each policy** here (table name, command, using expression, roles). Example template:

```sql
-- Table: "Booking"
-- Policy: guest_select_own
-- FOR SELECT TO authenticated
-- USING (auth.uid()::text = "guestId");
```

**TODO:** If the project standardizes on Supabase RLS for a subset of tables, generate this section from migration files.

## Related

- [security-audit.md](./security-audit.md)  
- Supabase RLS docs: [https://supabase.com/docs/guides/auth/row-level-security](https://supabase.com/docs/guides/auth/row-level-security)
