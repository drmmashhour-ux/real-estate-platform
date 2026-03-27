# Platform ecosystem roles

Defines the four participant types in the real estate platform.

| Role | Description |
|------|-------------|
| **Users** | People searching for property, experiences, or professional guidance. |
| **Licensed professionals** | Verified brokers and real estate professionals operating under regulatory frameworks. |
| **Owners / hosts** | Property owners offering rental or sale opportunities. |
| **Investors** | Participants seeking investment opportunities or partnerships. |

## In code

- **Prisma**: `PlatformRole` enum and `User.role` on the `User` model (`prisma/schema.prisma`).
- Use `USER`, `LICENSED_PROFESSIONAL`, `OWNER_HOST`, or `INVESTOR` when creating or querying users.
