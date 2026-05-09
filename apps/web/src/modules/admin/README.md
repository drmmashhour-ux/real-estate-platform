# Admin

## Purpose

Platform administration — user management, system settings, content moderation, and operational tools. This is the internal control panel for LECIPM operators.

## Owned Routes

| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/listings` | Listing moderation |
| `/admin/payments` | Payment overview |
| `/admin/settings` | Platform settings |

## Owned Data Models

| Model | Description |
|-------|-------------|
| AdminAuditLog | Admin action log |
| PlatformSetting | Platform configuration |

## Dependencies

- **Core** — auth, roles, permissions
- **Compliance** — audit trail, moderation rules
- **Dr Brain** — intelligence overlays

## What Must NOT Be Here

- Public-facing pages (use Core or Homes)
- Business logic for listings, bookings, investments
- User-facing UI components
- Payment processing logic (use BNHub/Stripe)

## Feature Flag

`FEATURE_DR_BRAIN` (shares with Dr Brain — admin surfaces)

## Audit Status

Internal module. Not public-facing. Requires ADMIN role.
