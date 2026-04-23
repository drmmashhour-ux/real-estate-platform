import { cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@repo/db";
import { requireAuthenticatedUser } from "@/lib/auth/require-session";
import { TENANT_CONTEXT_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { TenantSettingsForm } from "./TenantSettingsForm";
import { BillingProfileForm } from "./BillingProfileForm";
import { canManageTenant } from "@/modules/tenancy/services/tenant-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";
import { getVerifiedTenantIdForUser } from "@/modules/tenancy/services/tenant-page-guard";

export default async function TenantSettingsPage() {
  const { userId } = await requireAuthenticatedUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const cookieStore = await cookies();
  const rawTenant = cookieStore.get(TENANT_CONTEXT_COOKIE_NAME)?.value;
  const tenantId = await getVerifiedTenantIdForUser(userId, user.role);

  if (rawTenant && !tenantId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-amber-200">
        <p className="text-lg font-medium">Invalid workspace</p>
        <p className="mt-2 text-sm text-slate-400">
          <Link href="/dashboard/tenant" className="text-emerald-400 hover:underline">
            Choose a workspace
          </Link>
        </p>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-slate-200">
        <p className="text-lg font-medium">No workspace selected</p>
        <p className="mt-2 text-sm text-slate-400">
          <Link href="/dashboard/tenant" className="text-emerald-400 hover:underline">
            Choose a workspace
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  const membership = await prisma.tenantMembership.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  });
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId },
    include: { billingProfile: true },
  });
  if (!tenant) {
    return <p className="p-8 text-slate-400">Workspace not found.</p>;
  }

  const billing = tenant.billingProfile;
  const subject: TenantSubject = { platformRole: user.role, membership };
  const editable = canManageTenant(subject, tenant);

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-10 text-slate-100">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500/90">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Tenant name, branding placeholders, and defaults stored as JSON. Billing profile (future SaaS) can be added here.
        </p>
      </header>

      {editable ? (
        <>
          <TenantSettingsForm
            tenantId={tenant.id}
            initialName={tenant.name}
            initialSettings={tenant.settings as Record<string, unknown> | null}
          />
          <BillingProfileForm
            tenantId={tenant.id}
            initial={
              billing
                ? {
                    legalName: billing.legalName,
                    billingEmail: billing.billingEmail,
                    taxNumber: billing.taxNumber,
                    addressData: billing.addressData,
                  }
                : null
            }
          />
        </>
      ) : (
        <p className="text-sm text-slate-400">You do not have permission to edit this workspace.</p>
      )}

      <p className="text-sm">
        <Link href="/dashboard/tenant" className="text-emerald-400 hover:underline">
          ← Back to workspace
        </Link>
      </p>
    </div>
  );
}
