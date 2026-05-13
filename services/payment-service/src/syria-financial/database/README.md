# Syria Financial Database Module

Database namespace plan for future financial persistence.

- Uses the `syria_financial_` table prefix.
- Keeps financial records separate from existing booking models by storing external IDs instead of Prisma relations.
- Includes soft-delete fields where review or lifecycle records may need retention.
- Adds schema definitions only; no migration is deployed by this change.
