import { validateBeforeSignature } from "../apps/web/modules/production-guard/validationEngine";

function testBypass() {
  console.log("Running Bypass Protection Tests...");

  const mockDraft = { formKey: "PROMISE_TO_PURCHASE", contextJson: {} };
  
  // Case 1: Low Compliance Score
  const lowScore = 75;
  const res1 = validateBeforeSignature(mockDraft, { sections: [], notices: [] }, lowScore, true);
  console.log(`Test 1 (Low Score): ${!res1.canSign ? "✅ Protected" : "❌ BYPASS POSSIBLE"}`);

  // Case 2: Missing Notice
  const unacceptedNotice = { notices: [{ noticeKey: "PRIVACY", severity: "CRITICAL", acknowledged: false }] };
  const res2 = validateBeforeSignature(mockDraft, unacceptedNotice, 85, true);
  console.log(`Test 2 (Missing Notice): ${!res2.canSign ? "✅ Protected" : "❌ BYPASS POSSIBLE"}`);

  // Case 3: Unpaid
  const res3 = validateBeforeSignature(mockDraft, { sections: [], notices: [] }, 85, false);
  console.log(`Test 3 (Unpaid): ${!res3.canSign ? "✅ Protected" : "❌ BYPASS POSSIBLE"}`);

  // Case 4: Valid
  const validResult = { 
    sections: [
      { id: "PARTIES" }, { id: "PROPERTY" }, { id: "PRICE" }, { id: "FINANCING" }, 
      { id: "INSPECTION" }, { id: "WARRANTY" }, { id: "INCLUSIONS" }, { id: "EXPIRY" }, { id: "SIGNATURE" }
    ], 
    notices: [{ noticeKey: "PRIVACY", severity: "CRITICAL", acknowledged: true }] 
  };
  const res4 = validateBeforeSignature(mockDraft, validResult, 85, true);
  console.log(`Test 4 (Valid Draft): ${res4.canSign ? "✅ Correctly Allowed" : "❌ FALSE BLOCKING"}`);
}

testBypass();
