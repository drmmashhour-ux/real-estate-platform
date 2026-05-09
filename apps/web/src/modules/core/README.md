# Core

## Purpose

Auth, users, roles, account settings, platform shell, shared navigation, permissions, and audit events. This is the foundational module that every other LECIPM module depends on for identity, session management, and platform-wide chrome.

## Owned Routes

| Route | Description |
|---|---|
| `/` | Platform landing / dashboard |
| `/login` | Authentication sign-in |
| `/register` | New account creation |
| `/about-platform` | Platform information page |
| `/billing` | Subscription & payment settings |
| `/invite` | Workspace invitation flow |
| `/privacy` | Privacy policy / settings |
| `/help` | Help center & support |

## Owned Data Models

| Model | Description |
|---|---|
| `User` | Platform user identity and profile |
| `Session` | Authentication session records |
| `PlatformCodeSequence` | Sequential code generation for platform entities |
| `WorkspaceAuditLog` | Immutable audit trail for workspace-level events |

## Dependencies

- **Prisma** — database access layer
- **next-intl** — internationalization
- **design-system** — shared UI tokens and components

## What Does NOT Belong Here

- Business logic for listings, property search, or transactions (→ **Homes**)
- Booking or stay management (→ **BNHub**)
- Investment analysis, ROI tools, or portfolio tracking (→ **Invest**)
- Legal forms, contracts, or signature workflows (→ **Forms**)
- Messaging, chat, or lead scoring (→ **ImmoContact**)
