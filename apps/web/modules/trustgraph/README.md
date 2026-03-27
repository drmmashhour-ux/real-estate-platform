# TrustGraph module (`@/modules/trustgraph`)

Canonical implementation lives under **`lib/trustgraph/`** (domain / application / infrastructure). This folder exposes a **stable import surface** for other features.

```ts
import { trustScoringService } from "@/modules/trustgraph";
```

The repo does not use a `src/` app root; `modules/` matches `tsconfig` path `@/modules/*`.
