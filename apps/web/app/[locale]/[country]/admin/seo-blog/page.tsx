import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { hubNavigation } from "@/lib/hub/navigation";
import { SeoBlogCreateForm } from "./SeoBlogCreateForm";

export default async function AdminSeoBlogPage() {
  const id = await getGuestId();
  if (!id) redirect("/auth/login?returnUrl=/admin/seo-blog");
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/admin/dashboard");
  const role = await getUserRole();

  const posts = await prisma.seoBlogPost.findMany({
    orderBy: { publishedAt: "desc" },
    select: { id: true, slug: true, title: true, publishedAt: true, updatedAt: true },
  });

  return (
    <HubLayout title="SEO blog" hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-white">SEO blog (public articles)</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Posts are merged with static guides on <Link href="/blog" className="text-premium-gold hover:underline">/blog</Link> and
            included in <code className="text-slate-300">sitemap.xml</code>. DB articles override static content when slugs match.
          </p>
        </div>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Published &amp; scheduled</h2>
          <ul className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10">
            {posts.length === 0 ? (
              <li className="px-4 py-6 text-sm text-slate-500">No database articles yet.</li>
            ) : (
              posts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <Link href={`/admin/seo-blog/${p.id}/edit`} className="font-medium text-white hover:text-premium-gold">
                      {p.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      /blog/{p.slug} · pub {p.publishedAt.toISOString().slice(0, 10)}
                    </p>
                  </div>
                  <Link href={`/blog/${p.slug}`} className="text-sm text-premium-gold hover:underline">
                    View live
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        <SeoBlogCreateForm />
      </div>
    </HubLayout>
  );
}
