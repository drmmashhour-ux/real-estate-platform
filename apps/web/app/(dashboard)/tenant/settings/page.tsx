import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tenant settings",
  description: "Configure organization-level preferences.",
};

export default function TenantSettingsPage() {
  return (
    <main className="min-h-screen bg-[#0B0B0B] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-2xl font-semibold">Tenant settings</h1>
        <p className="mt-2 text-sm text-white/70">
          Placeholder for org branding, domains, roles, and audit policy. Connect to `/modules/tenancy` services when
          ready.
        </p>
      </div>
    </main>
  );
}
