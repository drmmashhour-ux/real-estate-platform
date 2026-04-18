# Git safety — LECIPM monorepo

Guidelines for **backward-compatible**, **reversible** changes on a near-production codebase. Pair with:

- `apps/web/scripts/safe-change-prep.ts` — inspect status, suggest backup branch name and commands  
- `apps/web/scripts/safe-rollback-help.ts` — current branch, recent commits, rollback options (no auto-execution)

```bash
cd apps/web
pnpm run safe:change-prep
pnpm run safe:change-prep -- --feature=my-risky-change
pnpm run safe:rollback-help
```

## 1. Create a backup branch before large Cursor / agent changes

1. Ensure working tree is understandable (`git status`, `git diff`).
2. From the **repository root** (monorepo root, not only `apps/web`):

   ```bash
   git checkout -b backup/pre-change-YYYYMMDD-HHMM
   git add -A
   git status   # review; exclude secrets
   git commit -m "backup before <short feature description>"
   ```

3. Optional tag on the same commit:

   ```bash
   git tag -a backup-YYYYMMDD-HHMM -m "checkpoint before <feature>"
   ```

4. Optional push for off-machine recovery:

   ```bash
   git push -u origin backup/pre-change-YYYYMMDD-HHMM
   git push origin backup-YYYYMMDD-HHMM
   ```

Use `pnpm run safe:change-prep` for a suggested branch name and copy-paste commands.

## 2. Restore from a backup branch

If you committed the backup branch and need to return **your local** branch to that state:

```bash
git fetch origin
git checkout <your-working-branch>
git reset --hard backup/pre-change-YYYYMMDD-HHMM
```

**Warning:** `reset --hard` drops commits not reachable from the backup. Prefer **cherry-pick** to rescue specific commits. On **shared** `main`, avoid hard reset; use **revert** (below).

## 3. Revert a bad commit safely

Keeps history linear and is the usual fix on `main`:

```bash
git log -5 --oneline
git revert <sha> --no-edit
git push
```

For a **merge commit**:

```bash
git revert -m 1 <merge_commit_sha>
```

## 4. Roll back a merged PR

- **Preferred:** `git revert` the merge commit (`-m 1`) or revert individual commits.  
- **Not preferred on shared main:** `git reset --hard` + force-push unless agreed with the team.

## 5. Disable risky code with feature flags (instead of deleting)

1. Central flags: `apps/web/config/feature-flags.ts` (and env vars documented there).  
2. Ship risky behavior behind `FEATURE_*` / `NEXT_PUBLIC_*` as appropriate.  
3. **Default off** in production until validated.  
4. Roll back behavior by toggling env in Vercel/host without rewriting git history.

## 6. Recover after a broken deploy

| Situation | Action |
|-----------|--------|
| Bad commit on `main` | `git revert` + push; CI redeploys |
| Need instant traffic fix | Vercel → **Deployments** → **Promote** previous production build |
| Flag caused regression | Disable flag in env → redeploy |
| Data / security validator | Run `pnpm run verify:rls`, `pnpm run launch:final-validate` (from `apps/web` as documented) |

Order of preference: **revert commit** or **redeploy previous build** → then **fix forward**; use **feature flag** to shield users while fixing.

## 7. What the automation scripts do *not* do

- They do **not** run `checkout`, `commit`, `reset`, `revert`, `clean`, or `push`.  
- They only **read** git state and **print** suggested commands. You stay in control.

## 8. Monorepo note

Git root is usually the **repo root** (`real-estate-platform/`), not `apps/web/`. Run git commands from the root unless you use `git -C /path/to/repo …`.

---

*Ship changes as: **Backward-Compatible Implementation with Git Safety**.*
