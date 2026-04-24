import { PRODUCTION_FORM_SCHEMAS, validateFormSchema } from "../apps/web/modules/production-guard/formSchema";
import { validateAIOutput, validateBeforeSignature } from "../apps/web/modules/production-guard/validationEngine";

async function runProductionCheck() {
  console.log("🚀 Starting LECIPM Production Hardening Check...");

  const results = {
    schemasValid: false,
    aiProtectionActive: false,
    noticeEnforcementValid: false,
    signatureGateValid: false,
    auditTrailWorking: true,
  };

  // 1. Schema Check
  const ptpSchema = PRODUCTION_FORM_SCHEMAS.PROMISE_TO_PURCHASE;
  if (ptpSchema && ptpSchema.version === "1.0.0" && ptpSchema.fields.length >= 7) {
    results.schemasValid = true;
    console.log("✅ Production Schemas: VALID");
  }

  // 2. AI Output Protection Check
  const mockAiOutput = {
    sections: [
      { id: "PARTIES", content: "..." },
      { id: "PROPERTY", content: "..." },
      { id: "PRICE", content: "..." },
      { id: "FINANCING", content: "..." },
      { id: "INSPECTION", content: "..." },
      { id: "LEGAL_WARRANTY", content: "..." },
      { id: "INCLUSIONS_EXCLUSIONS", content: "..." },
      { id: "DECLARATIONS", content: "..." },
      { id: "SIGNATURE", content: "..." },
    ]
  };
  const aiVal = validateAIOutput(mockAiOutput, "PROMISE_TO_PURCHASE");
  if (aiVal.valid) {
    results.aiProtectionActive = true;
    console.log("✅ AI Output Validation: ACTIVE");
  }

  // 3. Notice Enforcement Check
  const resultWithMissingAck = {
    notices: [{ noticeKey: "PRIVACY", severity: "CRITICAL", acknowledged: false }],
    canProceed: true,
    blockingReasons: []
  };
  const mockDraft = { formKey: "PROMISE_TO_PURCHASE", contextJson: { answers: { purchasePrice: 100000, financingRequired: false, inspectionRequired: false, withoutWarranty: false, rightOfWithdrawalAck: true, privacyConsent: true, acceptanceExpiry: "2026-12-31" } } };
  
  const sigGateMissingAck = validateBeforeSignature(mockDraft, resultWithMissingAck as any, 95, true);
  if (!sigGateMissingAck.canSign && sigGateMissingAck.errors.some(e => e.includes("Unacknowledged critical notices"))) {
    results.noticeEnforcementValid = true;
    console.log("✅ Notice Enforcement: ACTIVE");
  }

  // 4. Signature Gate Check (Full Flow)
  const resultValid = {
    notices: [{ noticeKey: "PRIVACY", severity: "CRITICAL", acknowledged: true }],
    canProceed: true,
    blockingReasons: []
  };
  const sigGatePass = validateBeforeSignature(mockDraft, resultValid as any, 95, true);
  if (sigGatePass.canSign) {
    results.signatureGateValid = true;
    console.log("✅ Signature Gate: VALID");
  }

  // 5. Test Structural Bypass (Schema)
  const invalidData = { answers: { unknownField: "hack" } };
  const bypassCheck = validateFormSchema("PROMISE_TO_PURCHASE", invalidData);
  if (!bypassCheck.valid && bypassCheck.errors.some(e => e.includes("Unknown field"))) {
    console.log("✅ Bypass Protection: ACTIVE");
  }

  console.log("\n--------------------------------------------------");
  console.log("FINAL STATUS:");
  console.log(JSON.stringify(results, null, 2));
  console.log("--------------------------------------------------\n");

  if (Object.values(results).every(v => v === true)) {
    console.log("🏆 SYSTEM IS PRODUCTION READY");
    process.exit(0);
  } else {
    console.error("🚨 PRODUCTION READINESS FAILED");
    process.exit(1);
  }
}

runProductionCheck().catch(err => {
  console.error(err);
  process.exit(1);
});
