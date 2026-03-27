"use client";

import { AdminFormAiRefill } from "@/components/admin/AdminFormAiRefill";
import type { AdminFormId } from "@/lib/ai/refill-admin-form";

export function AdminFormRefillBar({ formId }: { formId: string }) {
  const id = formId as AdminFormId;
  return (
    <div className="mb-6">
      <AdminFormAiRefill formId={id} />
    </div>
  );
}
