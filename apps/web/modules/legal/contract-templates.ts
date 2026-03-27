/**
 * Reference contract frameworks — drafting-book order (English).
 * Not legal advice; counsel should review before production use.
 * Pair with `modules/contracts` for executable templates where wired.
 */

const DISPUTE_BLOCK = `## 9. Dispute resolution
Where a dispute arises, parties are encouraged to use internal platform review when available. Conciliation or mediation may be appropriate. Arbitration applies only if provided for in a signed agreement and permitted by law. Court access and other rights remain subject to applicable law; platform terms do not override mandatory consumer or statutory protections.`;

const GOVERNING_LAW = `## 10. Governing law & interpretation
These framework terms are governed by the laws applicable to the parties’ agreements and listings. Headings are for convenience.`;

export const CONTRACT_TEMPLATE_MARKDOWN = {
  buyerAgreement: `# Buyer agreement (framework)

## 1. Identification of parties
The **buyer** and the **seller** (and professionals they retain) are the parties to a transaction. The **platform** provides tools and workflow support unless a separate written agreement states otherwise.

## 2. Object / purpose and duration
The buyer seeks to acquire an interest in property on terms to be set out in a binding purchase contract.

## 3. Property / subject description
The subject property is as described in the listing and any offer; buyers must verify boundaries, title, zoning, and condition.

## 4. Price / payment / conditions
Price, deposits, and conditions are set in the parties’ contract, not in this framework.

## 5. Obligations of each party
Buyers must act in good faith and complete diligence. Sellers must disclose material facts as required by law and the listing flow.

## 6. Declarations / disclosures
Disclosures may be required by law or platform rules; incomplete disclosures may delay or block publication.

## 7. Annexes / attached documents
Schedules, plans, and inspection reports may be attached to the purchase contract as agreed.

## 8. Signatures
Binding obligations arise from executed agreements between the parties.

${DISPUTE_BLOCK}

${GOVERNING_LAW}`,

  sellerAgreement: `# Seller agreement (framework)

## 1. Identification of parties
The **seller** markets property through the platform subject to these principles and any signed seller terms.

## 2. Object / purpose and duration
The seller seeks qualified interest through listings for a period allowed by platform rules.

## 3. Property / subject description
Listings must describe the property using structured fields where required; material facts should be accurate and supportable.

## 4. Price / payment / conditions
Commissions, fees, and splits follow platform settings and signed agreements.

## 5. Obligations of each party
Sellers must co-operate with verification, respond to good-faith inquiries, and maintain listing accuracy.

## 6. Declarations / disclosures
Seller declarations are mandatory where the product requires them before activation.

## 7. Annexes / attached documents
Title references, plans, and declarations may be linked as annexes to the listing or contracts.

## 8. Signatures
Electronic or wet signatures follow platform signing flows.

${DISPUTE_BLOCK}

${GOVERNING_LAW}`,

  rentalAgreement: `# Long-term rental agreement (framework)

## 1. Identification of parties
**Landlord** and **tenant** (and the platform as facilitator where stated).

## 2. Object / purpose and duration
Lease of residential premises for a term and rent to be set in the written lease.

## 3. Property / subject description
Premises, services, and inclusions as listed and inspected.

## 4. Price / payment / conditions
Rent, deposits, and utilities as agreed; statutory caps may apply.

## 5. Obligations of each party
Landlord: habitability and lawful access. Tenant: rent, care, and rules.

## 6. Declarations / disclosures
Pre-rental disclosures and notices as required by law and the flow.

## 7. Annexes / attached documents
Rules, schedules, and addenda form part of the lease when attached.

## 8. Signatures
Lease execution follows landlord–tenant law and platform tools.

${DISPUTE_BLOCK}

${GOVERNING_LAW}`,

  shortTermStayAgreement: `# Short-term stay agreement (framework)

## 1. Identification of parties
**Host** and **guest**; platform facilitates payment and policies.

## 2. Object / purpose and duration
Short-term occupancy for confirmed dates subject to cancellation rules.

## 3. Property / subject description
Accommodation, amenities, and access as listed; special services disclosed as included, extra, or subject to confirmation.

## 4. Price / payment / conditions
Total, fees, and taxes per checkout; refunds per policy.

## 5. Obligations of each party
Guest: rules, safety, and care. Host: accurate listing and lawful premises.

## 6. Declarations / disclosures
House rules, safety, and cancellation framework acknowledged before payment.

## 7. Annexes / attached documents
House manuals or local notices may be linked.

## 8. Signatures
Booking confirmation and guest acknowledgment record acceptance.

${DISPUTE_BLOCK}

${GOVERNING_LAW}`,
} as const;
