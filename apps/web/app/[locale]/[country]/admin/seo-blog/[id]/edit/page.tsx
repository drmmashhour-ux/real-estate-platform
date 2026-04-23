import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getGuestId, getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { HubLayout } from "@/components/hub/HubLayout";
import { prisma } from "@repo/db";
import { hubNavigation } from "@/lib/hub/navigation";
import { SeoBlogEditForm } from "../../SeoBlogEditForm";

type Props = { params: Promise<{ id: string }>; searchParams?: Promise<{ created?: string }> };

export default async function AdminSeoBlogEditPage({ params, searchParams }: Props) {
  const guestId = await getGuestId();
  if (!guestId) redirect("/auth/login?returnUrl=/admin/seo-blog");
  const user = await prisma.user.findUnique({ where: { id: guestId }, select: { role: true } });
  if (user?.role !== "ADMIN") redirect("/admin/dashboard");

  const { id } = await params;
  const { created } = (await searchParams) ?? {};
  const post = await prisma.seoBlogPost.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      body: true,
      excerpt: true,
      city: true,
      keywords: true,
      publishedAt: true,
    },
  });
  if (!post) notFound();

  const role = await getUserRole();

  return (
    <HubLayout title={`Edit: ${post.title}`} hubKey="admin" navigation={hubNavigation.admin} showAdminInSwitcher={isHubAdminRole(role)}>
      <div className="space-y-4">
        <Link href="/admin/seo-blog" className="text-sm text-premium-gold hover:underline">
          ← All articles
        </Link>
        <SeoBlogEditForm post={post} created={created === "1"} />
      </div>
    </HubLayout>
  );
}
