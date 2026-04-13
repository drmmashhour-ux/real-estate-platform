# Vercel CLI command reference

Install the CLI once: `npm i -g vercel` or use `pnpm dlx vercel`. Link the repo to a project: `vercel link` (from `apps/web` or the directory Vercel builds from).

> Flags and subcommands change over time. Always run `--help` on your installed version.

## Common commands

| Command | Purpose |
|---------|---------|
| `vercel` | Deploy current directory to a **preview** deployment (interactive). |
| `vercel --prod` | Deploy to **production** (dangerous for routine use — prefer Git merge to `main`). |
| `vercel promote <deployment-url-or-id>` | Promote a specific deployment to production (when your workflow uses it). |
| `vercel rollback` | Roll production back (see [vercel-rollback.md](./vercel-rollback.md)). |
| `vercel logs [url\|deploymentId]` | Stream or fetch runtime logs for a deployment. |
| `vercel ls` | List deployments. |
| `vercel inspect <url\|id>` | Build and deployment details. |

## Examples

```bash
cd apps/web
vercel link    # once per machine

# List recent deployments
vercel ls

# Inspect a specific deployment
vercel inspect https://your-app-xxx.vercel.app

# Logs (syntax may vary)
vercel logs https://your-app-xxx.vercel.app
```

## Project and scope

- **`vercel whoami`** — confirm account.  
- **`vercel project ls`** — list projects (CLI version dependent).

## Related

- [vercel-deploy-flow.md](./vercel-deploy-flow.md) — when not to use `--prod` from a laptop.  
- [vercel-logs.md](./vercel-logs.md)  
- [vercel-rollback.md](./vercel-rollback.md)  
