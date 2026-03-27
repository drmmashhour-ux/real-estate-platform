"use client";

import { useRouter } from "next/navigation";
import {
  RequiredDocumentsChecklist,
  type ChecklistItem,
} from "@/components/intake/RequiredDocumentsChecklist";

export function IntakeChecklistRefresh(props: {
  brokerClientId: string;
  items: ChecklistItem[];
  role: "broker" | "client";
}) {
  const router = useRouter();
  return (
    <RequiredDocumentsChecklist
      {...props}
      onChanged={() => router.refresh()}
    />
  );
}
