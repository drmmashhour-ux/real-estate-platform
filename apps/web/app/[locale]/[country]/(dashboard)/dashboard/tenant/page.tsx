import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@repo/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { TENANT_CONTEXT_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { TenantSwitcher } from "@/components/tenancy/TenantSwitcher";
import { TenantMembersTable } from "@/components/tenancy/TenantMembersTable";
import { InviteTenantMemberDialog } from "@/components/tenancy/InviteTenantMemberDialog";
import { CreateWorkspaceForm } from "./CreateWorkspaceForm";
import { canManageTenantMembers } from "@/modules/tenancy/services/tenant-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";
import { getVerifiedTenantIdForUser } from "@/modules/tenancy/services/tenant-page-guard";

export default async function TenantWorkspacePage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { role: true },
  });
  const cookieStore = await cookies();
  const rawTenantCookie = cookieStore.get(TENANT_CONTEXT_COOKIE_NAME)?.value?.trim() || null;
  const currentTenantId = await getVerifiedTenantIdForUser(userId, user.role);

  const memberships = await prisma.tenantMembership.findMany({
    where: { userId, status: { in: ["ACTIVE", "INVITED"] } },
    include: { tenant: true },
    orderBy: { updatedAt: "desc" },
  });

  const tenantOptions = memberships.map((m) => ({
    tenantId: m.tenantId,
    name: m.tenant.name,
    slug: m.tenant.slug,
    role: m.role,
  }));

  let members: {
    id: string;
    role: (typeof memberships)[0]["role"];
    status: (typeof memberships)[0]["status"];
    email: string | null;
    name: string | null;
  }[] = [];
  let canManage = false;

  if (currentTenantId) {
    const m =
      memberships.find((x) => x.tenantId === currentTenantId && x.status === "ACTIVE") ?? null;
    const tenant = await prisma.tenant.findFirst({ where: { id: currentTenantId } });
    if (tenant) {
      const subject: TenantSubject = { platformRole: user.role, membership: m };
      canManage = canManageTenantMembers(subject, tenant);
    }

    const rows = await prisma.tenantMembership.findMany({
      where: { tenantId: currentTenantId },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    members = rows.map((r) => ({
      id: r.id,
      role: r.role,
      status: r.status,
      email: r.user.email,
      name: r.user.name,
    }));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 text-slate-100">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500/90">Workspace</p>
        <h1 className="mt-1 text-3xl font-semibold">Team & workspace</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-400">
          Workspaces isolate your agency data. Switch workspace to refresh listings, CRM, and finance context.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Current workspace</h2>
        {rawTenantCookie && !currentTenantId ? (
          <p className="text-sm text-amber-400/90">
            Your saved workspace is not valid for this account. Select a workspace below.
          </p>
        ) : null}
        <TenantSwitcher tenants={tenantOptions} currentTenantId={currentTenantId} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Create workspace</h2>
        <CreateWorkspaceForm />
      </section>

      {currentTenantId ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Team members</h2>
            {canManage ? <InviteTenantMemberDialog tenantId={currentTenantId} /> : null}
          </div>
          <TenantMembersTable tenantId={currentTenantId} members={members} canManage={canManage} />
        </section>
      ) : (
        <p className="text-sm text-amber-400/90">Select a workspace above to manage team members.</p>
      )}

      <p className="text-sm">
        <Link href="/dashboard/tenant/settings" className="text-emerald-400 hover:underline">
          Workspace settings
        </Link>
      </p>
    </div>
  );
}
