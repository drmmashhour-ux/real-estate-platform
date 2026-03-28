/**
 * Next.js App Router segment config for routes that depend on DB-backed sessions.
 * Re-export from each protected `layout.tsx` / `page.tsx` so RSC is not statically cached.
 *
 * For `fetch` inside **Server Components** in these trees, prefer `{ cache: "no-store" }` or `@/lib/http/fetch-no-store`.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
