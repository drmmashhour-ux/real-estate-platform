# Design System

## Purpose

Shared black/gold/white premium visual system — design tokens, reusable components, layout shells, and typography. The design system provides a consistent, branded look-and-feel consumed by every hub in the platform.

## Owned Routes

None. The design system is a pure library module consumed by all other modules.

## Owned Data Models

None. The design system has no data layer.

## Dependencies

- **Tailwind CSS** — utility-first styling framework
- **Existing `src/design/` tokens** — foundational colour, spacing, and typography tokens

## What Does NOT Belong Here

- Business logic of any kind
- API calls or data fetching
- Database access or Prisma usage
- Authentication or authorization checks
