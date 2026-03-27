# Backend (BFF / orchestration)

This folder is reserved for **future** consolidated HTTP APIs or BFF layers (e.g. a dedicated Node gateway in front of microservices).

Today, the primary API surface lives in **`apps/web`** (Next.js route handlers) and in individual **`services/*`** packages (auth, listings, AI, etc.). Add a deployable `services/backend` workspace here when you split traffic away from the Next monolith.

When you add **`package.json`** here, use the workspace name **`@lecipm/backend`** so `.github/workflows/backend.yml` can build and test it automatically.
