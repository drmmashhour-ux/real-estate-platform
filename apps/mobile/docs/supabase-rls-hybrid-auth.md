# BNHub RLS tightening (hybrid guest + authenticated)

This document describes the **intended** Row Level Security posture for BNHub Supabase data. The production database may still run **permissive** policies during migration; tighten gradually without breaking guest checkout.

## Current server model (apps/web)

- **Guest booking**: `POST /api/bookings/create` uses the **service role** to call `create_guest_booking` RPC. Guests never need `auth.uid()` on the client for booking creation.
- **Ownership**: When a user sends `Authorization: Bearer <supabase_access_token>`, the API derives `user_id` server-side and passes `p_user_id` into the RPC. The mobile app does **not** send `user_id` in the JSON body.
- **Host / admin APIs**: `assertBnhubHostOrAdmin`, `requireMobileAdmin`, etc. validate JWTs on the Next.js layer. RLS is an additional future layer, not the only gate today.

## What stays permissive temporarily

- Broad read policies on `listings` (or public anon read) may remain so the guest app can browse without login.
- Service role bypasses RLS for booking RPC and Stripe webhooks — **required** for the current architecture.

## Future `auth.uid()`-based policies (target)

| Resource | Direction |
| -------- | --------- |
| `bookings` | `SELECT` for rows where `user_id = auth.uid()`; guest-only rows remain tied to email verification flows or service-only access until email claim patterns are stable. |
| `listings` (host) | `UPDATE`/`INSERT` where `host_user_id = auth.uid()` (or equivalent). |
| Reviews | `INSERT` where reviewer is verified against a completed paid booking (already enforced in app code; RLS can mirror). |

## Operational note

Apply SQL migrations in documented order: `supabase-bookings-user-id.sql` before replacing `create_guest_booking`, so `p_user_id` exists on insert.

## Marketplace columns (future DB-level policy)

- **`listings.stripe_connect_account_id`** — host payout identity (see `docs/bnhub/stripe-connect-marketplace.md`); keep **SELECT** restricted to hosts/admins when RLS tightens; public browse may stay on a safe view or redacted fields.
- **`listings.latitude` / `longitude`** — map search; public read is acceptable for published stays; writes host-only.
