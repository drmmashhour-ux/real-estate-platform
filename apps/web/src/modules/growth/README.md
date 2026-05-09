# Growth

## Purpose

Marketing automation, SEO content generation, growth analytics, and user acquisition tools. Powers programmatic landing pages, social publishing, and conversion tracking.

## Owned Routes

| Route | Description |
|-------|-------------|
| `/growth` | Growth dashboard (internal) |
| `/growth-seo/[slug]` | Programmatic SEO landing pages |
| `/blog/[slug]` | Blog posts (SEO) |

## Owned Data Models

| Model | Description |
|-------|-------------|
| SeoPageContent | Programmatic SEO page content |
| SeoBlogPost | Generated blog posts |
| GrowthCampaign | Marketing campaign tracking |

## Dependencies

- **Core** — auth, analytics
- **Homes** — listing data for SEO pages
- **BNHub** — stay data for SEO pages

## What Must NOT Be Here

- User-facing marketplace logic (use Homes)
- Booking/payment logic (use BNHub)
- Legal/compliance rules (use Compliance)
- Admin-only monitoring (use Dr Brain)

## Feature Flag

`FEATURE_GROWTH` (not yet defined — uses default ON for SEO pages)

## Audit Status

SEO pages are public. Growth dashboard is internal.
