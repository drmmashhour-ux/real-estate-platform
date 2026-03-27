"use client";

import { useState } from "react";
import { LegalAgreementModal } from "@/components/legal/LegalAgreementModal";

type Props = {
  needsPlatformIntermediary: boolean;
  needsBrokerCollaboration: boolean;
  children: React.ReactNode;
};

/**
 * Shows the global legal modal on first dashboard visit until `UserAgreement` rows exist.
 */
export function PlatformLegalGate({
  needsPlatformIntermediary,
  needsBrokerCollaboration,
  children,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  const open = !dismissed && (needsPlatformIntermediary || needsBrokerCollaboration);

  return (
    <>
      {children}
      <LegalAgreementModal
        open={open}
        needsPlatformIntermediary={needsPlatformIntermediary}
        needsBrokerCollaboration={needsBrokerCollaboration}
        onComplete={() => setDismissed(true)}
      />
    </>
  );
}
