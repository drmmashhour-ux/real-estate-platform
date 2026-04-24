import { buildTurboDraft } from "./draftBuilder";
import { TurboDraftInput } from "./types";

async function testValidation() {
  console.log("🚀 Testing FormStyleValidationEngine...");

  const baseInput: TurboDraftInput = {
    formKey: "PROMISE_TO_PURCHASE",
    role: "BUYER",
    transactionType: "SALE",
    propertyType: "RESIDENTIAL",
    representedStatus: "NOT_REPRESENTED",
    parties: [{ id: "u1", role: "BUYER", name: "John Doe", email: "john@example.com" }],
    property: { address: "123 Main St", city: "Montreal", type: "RESIDENTIAL" },
    answers: {
      purchasePrice: 50000000,
      financingRequired: true,
      financingDelay: "15",
      withoutWarranty: false,
      rightOfWithdrawalAck: true,
      privacyConsent: true,
      representationAck: true
    },
    locale: "fr"
  };

  // Test 1: Valid Draft
  const validResult = await buildTurboDraft(baseInput);
  console.log(`Test 1 (Valid Draft): ${validResult.canProceed ? "✅ PASS" : "❌ FAIL"}`);

  // Test 2: Missing Financing Delay
  const missingFinancing = await buildTurboDraft({
    ...baseInput,
    answers: { ...baseInput.answers, financingDelay: "" }
  });
  console.log(`Test 2 (Missing Financing): ${!missingFinancing.canProceed ? "✅ PASS" : "❌ FAIL"} (Expected blocked)`);

  // Test 3: Unclear Warranty
  // Note: buildTurboDraft currently generates the warranty content deterministically, 
  // so to test the validator we'd need to mock the content or change the builder.
  // For now, let's just check the result of Test 2 more deeply.
  if (!missingFinancing.canProceed) {
    console.log("Blocking reasons:", missingFinancing.blockingReasons);
  }
}

testValidation().catch(console.error);
