import { alignDraftToFormSchema } from "./alignmentEngine";

export function testFormValidation() {
  console.log("--- Testing FormStyleValidationEngine ---");

  const mockDraftSections = [
    { id: "PARTIES", title: "Parties", content: "Vendeur: Alice, Acheteur: Bob" },
    { id: "PRICE", title: "Prix", content: "Le prix est de 500,000" }, // Missing $
    { id: "LEGAL_WARRANTY", title: "Garantie", content: "Sans garantie" } // Ambiguous
  ];

  const result = alignDraftToFormSchema("PROMISE_TO_PURCHASE", mockDraftSections);

  console.log("Aligned Sections Order:", result.sections.map(s => s.id));
  console.log("Missing Sections:", result.validation.sections.missingSections);
  console.log("Clause Issues:", result.validation.clauses.map(c => c.issue));

  const canProceed = result.validation.sections.missingSections.length === 0 && 
                    !result.validation.clauses.some(c => c.blocking);
  
  console.log("Can Proceed:", canProceed);
}

// Simple test run (if this were a real test environment)
// testFormValidation();
