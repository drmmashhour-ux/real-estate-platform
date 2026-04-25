# LECIPM Production Deployment Setup (Vercel)

## 1. Project Structure
Each application in the monorepo must be deployed as a separate Vercel project with its own root directory.

| App | Root Directory | Production URL |
|-----|----------------|----------------|
| **Web (Core)** | `apps/web` | `https://lecipm.com` |
| **BNHub** | `apps/bnhub` | `https://bnhub.lecipm.com` |
| **Broker Hub** | `apps/broker` | `https://broker.lecipm.com` |
| **Admin Hub** | `apps/admin` | `https://admin.lecipm.com` |

## 2. Global Environment Variables
Ensure the following variables are set across ALL projects to enable cross-app routing and shared authentication.

```bash
NEXT_PUBLIC_WEB_URL=https://lecipm.com
NEXT_PUBLIC_BNHUB_URL=https://bnhub.lecipm.com
NEXT_PUBLIC_BROKER_URL=https://broker.lecipm.com
NEXT_PUBLIC_ADMIN_URL=https://admin.lecipm.com

# Auth & Cookies
NEXT_PUBLIC_COOKIE_DOMAIN=.lecipm.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
```

## 3. Shared Authentication
The `NEXT_PUBLIC_COOKIE_DOMAIN` must be set to `.lecipm.com` (note the leading dot) to allow session cookies to persist across subdomains.

## 4. Build Commands
Use the standard Next.js build command for each project:
`pnpm build`

## 5. Domain Management
Add the specific subdomains to each Vercel project's domain settings:
- `lecipm.com` and `www.lecipm.com` → **Web Project**
- `bnhub.lecipm.com` → **BNHub Project**
- `broker.lecipm.com` → **Broker Project**
- `admin.lecipm.com` → **Admin Project**
