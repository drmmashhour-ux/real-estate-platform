# Web test helpers

## Conventions

- **Colocate** tests as `__tests__/*.test.ts` next to the module or under `lib/**/__tests__/`.
- **Prisma:** Prefer integration tests against a test DB when possible; for unit tests, mock `vi.mock("@/lib/db")` with the minimal surface used by the module under test.
- **API routes:** Test handler logic by extracting pure functions into `lib/` and unit-testing those; route tests are optional smoke tests.

## Shared helpers

- Add small factories here (`factories.ts`) only when **three or more** test files need the same shape — avoid premature abstraction.

## Payment / booking / AI

- Keep mocks **narrow** (only methods called) to reduce brittle failures when Prisma client evolves.
