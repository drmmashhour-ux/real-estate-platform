import Link from "next/link";
import { notFound } from "next/navigation";
import { ControlsDashboardClient } from "@/app/[locale]/[country]/admin/controls/controls-dashboard-client";
import { PoliciesDashboardClient } from "@/app/[locale]/[country]/admin/policies/policies-dashboard-client";
import { PropertyIdentityConsoleClient } from "@/app/[locale]/[country]/admin/property-identities/property-identity-console-client";
import { AdminFormRefillBar } from "./AdminFormRefillBar";
import { AdminFormSubmissionView } from "../AdminFormSubmissionView";
import { getAllFeatureFlags, getActiveControls, getControlAuditLog } from "@/lib/operational-controls";
import { ensureDefaultPolicies, getAllPolicyRules, getPolicyDecisionLog } from "@/lib/policy-engine";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

const OPERATIONAL_FORM_IDS = ["controls", "policies", "property-identities"] as const;

type Params = { id: string };

export default async function AdminFormEditPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  if (OPERATIONAL_FORM_IDS.includes(id as (typeof OPERATIONAL_FORM_IDS)[number])) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Link href="/admin/forms" className="text-sm text-amber-400 hover:text-amber-300">
            ← Forms
          </Link>
          <h1 className="mt-4 text-2xl font-semibold capitalize">
            {id.replace(/-/g, " ")}
          </h1>
          <AdminFormRefillBar formId={id} />
          <div className="mt-6">
            {id === "controls" && <ControlsFormContent />}
            {id === "policies" && <PoliciesFormContent />}
            {id === "property-identities" && <PropertyIdentitiesFormContent />}
          </div>
        </div>
      </main>
    );
  }

  const submission = await prisma.formSubmission.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: "desc" } } },
  });
  if (!submission) notFound();

  const payload = (submission.payloadJson || {}) as Record<string, unknown>;
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/admin/forms" className="text-sm text-amber-400 hover:text-amber-300">
          ← Form submissions
        </Link>
        <AdminFormSubmissionView
          submission={{
            id: submission.id,
            formType: submission.formType,
            status: submission.status,
            clientName: submission.clientName,
            clientEmail: submission.clientEmail,
            assignedTo: submission.assignedTo,
            createdAt: submission.createdAt.toISOString(),
            updatedAt: submission.updatedAt.toISOString(),
            payloadJson: payload,
          }}
          activities={submission.activities.map((a) => ({
            id: a.id,
            action: a.action,
            note: a.note,
            createdAt: a.createdAt.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}

async function ControlsFormContent() {
  const [flags, controls, auditLog] = await Promise.all([
    getAllFeatureFlags(),
    getActiveControls(),
    getControlAuditLog(30),
  ]);
  return (
    <ControlsDashboardClient
      initialFlags={flags}
      initialControls={controls}
      initialAuditLog={auditLog}
    />
  );
}

async function PoliciesFormContent() {
  await ensureDefaultPolicies();
  const [rules, decisionLog] = await Promise.all([
    getAllPolicyRules(),
    getPolicyDecisionLog({ limit: 50 }),
  ]);
  return (
    <PoliciesDashboardClient
      initialRules={rules}
      initialDecisionLog={decisionLog}
    />
  );
}

async function PropertyIdentitiesFormContent() {
  const [identities, pendingLinks] = await Promise.all([
    prisma.propertyIdentity.findMany({
      include: {
        riskRecords: { orderBy: { lastEvaluatedAt: "desc" }, take: 1 },
        _count: { select: { links: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.propertyIdentityLink.findMany({
      where: { linkStatus: "pending" },
      include: { propertyIdentity: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <PropertyIdentityConsoleClient
      initialIdentities={identities.map((i) => ({
        id: i.id,
        propertyUid: i.propertyUid,
        cadastreNumber: i.cadastreNumber,
        officialAddress: i.officialAddress,
        municipality: i.municipality,
        province: i.province,
        verificationScore: i.verificationScore,
        linkCount: i._count.links,
        risk: i.riskRecords[0] ? { riskLevel: i.riskRecords[0].riskLevel, riskScore: i.riskRecords[0].riskScore } : null,
        updatedAt: i.updatedAt,
      }))}
      pendingLinks={pendingLinks.map((l) => ({
        id: l.id,
        listingId: l.listingId,
        listingType: l.listingType,
        linkStatus: l.linkStatus,
        propertyIdentityId: l.propertyIdentityId,
        propertyUid: l.propertyIdentity.propertyUid,
        officialAddress: l.propertyIdentity.officialAddress,
        createdAt: l.createdAt,
      }))}
    />
  );
}
