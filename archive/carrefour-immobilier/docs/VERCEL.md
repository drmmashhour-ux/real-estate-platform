# Deploy — Vercel

```bash
npm install -g vercel
vercel
```

1. Follow the CLI prompts (link project, pick scope, confirm settings).
2. In the **Vercel dashboard** → your project → **Settings → Environment variables**, add the same keys as `.env.example`:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `STRIPE_SECRET_KEY`
   - `OPENAI_API_KEY`
   - `JWT_SECRET` (use a long random string in production)
3. Redeploy after changing env vars.

**Note:** Use a managed Postgres (Neon, Supabase, Railway, etc.) reachable from Vercel’s network. Run migrations against that DB (`npx prisma migrate deploy`) from CI or your machine before going live.
