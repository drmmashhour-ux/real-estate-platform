"use client";

import { useState } from "react";

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: "What does the double representation prohibition mean?",
    answer:
      "Brokers may not represent both the buyer and the seller (or both parties) in the same residential real estate transaction. A broker must not be bound by a brokerage contract to each party simultaneously. Refer to the regulator’s official guidance for full definitions and examples.",
  },
  {
    question: "What are the transactions involved?",
    answer:
      "The prohibition applies to residential real estate brokerage transactions in Quebec, including purchase and sale and, where applicable, lease transactions. Commercial and other transaction types may be subject to different rules; consult REBA and regulator bulletins.",
  },
  {
    question:
      "What are the real estate broker's obligations when a double representation situation arises?",
    answer:
      "The broker must not act for both parties. He or she must disclose the situation, ensure that one party is represented by another broker or that the representation is terminated for one party in accordance with the law, and comply with any obligation to provide fair treatment where applicable.",
  },
  {
    question:
      "Why is double representation prohibited, and what are the various steps to follow?",
    answer:
      "Double representation is prohibited to protect consumers and avoid conflicts of interest. Steps typically include: identifying the situation, disclosing it to the parties, terminating or adjusting representation so that only one party is represented by the broker (or the agency), and documenting the steps. Follow the OACIQ and REBA guidelines in force.",
  },
  {
    question:
      "What are the agency executive officer's obligations when an agency broker faces a double representation situation?",
    answer:
      "The agency’s executive officer must ensure that the broker does not represent both parties and that the agency’s policies and procedures for handling potential double representation are applied. Supervision and training on these situations are required.",
  },
  {
    question:
      "What are the applicable double representation measures for brokers working in a team?",
    answer:
      "Measures apply at the level of the broker and the agency. A broker in a team cannot represent both parties in the same transaction; the same prohibition applies when considering the team or agency as a whole. Consult the regulator’s guidance on teams and double representation.",
  },
  {
    question:
      "When should the brokerage contract to purchase be terminated in a situation of double representation?",
    answer:
      "The brokerage contract to purchase should be terminated when necessary to eliminate the double representation (e.g. when the same broker or agency would otherwise represent both buyer and seller). Termination must be done in accordance with REBA and the contract terms, and the parties must be informed.",
  },
  {
    question: "Will there be exceptions to the double representation prohibition?",
    answer:
      "REBA and the regulator may provide for limited exceptions in specific circumstances. Any exception must be applied strictly in line with the law and official interpretations. Check the current OACIQ/AMF publications for any listed exceptions.",
  },
  {
    question: "What does providing fair treatment mean?",
    answer:
      "When a broker is not representing a party but is providing fair treatment, he or she must act with honesty, fairness and transparency toward that party, without favouring the represented client to the detriment of the other. The exact scope of duties is set out in REBA and regulator guidance.",
  },
  {
    question:
      "When providing fair treatment to a party, does the real estate broker have an obligation to disclose factors relevant to the property and provide the content of the DS?",
    answer:
      "Yes. When providing fair treatment, the broker must disclose material factors relevant to the property and provide the content of the description sheet (DS) as required by law and the regulator’s rules, so that the party can make an informed decision.",
  },
  {
    question: "What does representing a client mean?",
    answer:
      "Representing a client means acting as the client’s agent under a brokerage contract, with the duties of loyalty, confidentiality, and diligence owed to that client. Representation creates a fiduciary relationship; the broker must not represent the other party in the same transaction.",
  },
  {
    question:
      "Is it possible to represent a buyer without signing a brokerage contract to purchase?",
    answer:
      "As a rule, representation of a buyer in a purchase transaction requires a brokerage contract to purchase (BCP) in compliance with the post–June 2022 REBA amendments. Acting without a BCP may be permitted only in limited situations (e.g. collaborating broker) as defined by the regulator.",
  },
  {
    question:
      "Is a collaborating broker without a brokerage contract covered by professional liability insurance?",
    answer:
      "Coverage depends on the terms of the insurance contract and the regulator’s requirements. Brokers should confirm with their agency and insurer that their role (e.g. collaborating without a BCP) is covered under the agency’s or their own professional liability insurance.",
  },
  {
    question:
      "How is compensation shared between a seller's broker and a buyer's broker who signed a BCP?",
    answer:
      "Compensation sharing between the seller’s broker and the buyer’s broker who has signed a BCP is governed by the brokerage contract to sell, the description sheet, and any applicable referral or co-brokerage agreements. The terms must be disclosed to the parties as required by REBA.",
  },
  {
    question:
      "Is there a time frame for the implementation of the amendments to the REBA that came into force on June 10, 2022?",
    answer:
      "The amendments came into force on June 10, 2022. Implementation timelines for specific obligations (e.g. contract forms, disclosure) were set by the regulator. Refer to OACIQ/AMF communications and the REBA for the exact dates applicable to each requirement.",
  },
  {
    question:
      "If a promise to purchase is drafted and signed by the buyer before June 10, 2022, can it be handled according to the rules that were in effect before June 10?",
    answer:
      "Transactions in progress before June 10, 2022, may be subject to transitional rules. Whether a promise to purchase signed before that date can be handled under the former rules depends on the regulator’s transitional guidance. Consult the OACIQ/AMF bulletins for the applicable criteria.",
  },
  {
    question:
      "Can the amount of remuneration that the seller's broker pays to the broker who has a brokerage contract to purchase be different from the amount paid to the collaborating broker without a brokerage contract? Can he indicate in the brokerage contract to sell and in the description sheet that the remuneration sharing will be different depending on whether or not the broker has a brokerage contract?",
    answer:
      "Different remuneration may be offered to a broker with a BCP versus a collaborating broker without a BCP, provided this is clearly stated in the brokerage contract to sell and in the description sheet, and that the arrangement complies with REBA and the regulator’s rules on disclosure and fairness.",
  },
  {
    question:
      "Can the seller's broker who provides fair treatment recommend to buyers a particular broker or brokers to represent them? Can the seller's broker be compensated for referring buyers to a particular broker?",
    answer:
      "A seller’s broker providing fair treatment may recommend one or more brokers to represent the buyer, in line with the regulator’s rules on referrals and disclosure. Whether the seller’s broker may receive compensation for such a referral is governed by REBA and the OACIQ’s standards; any referral fee must be disclosed as required.",
  },
  {
    question:
      "Is it mandatory on June 10, 2022 for a broker wishing to represent a tenant to enter into a brokerage contract with him? Can the BCP form be used with adaptations?",
    answer:
      "As of June 10, 2022, representation of a tenant typically requires a brokerage contract. The regulator may allow use of the BCP form with adaptations for tenant representation, or provide a dedicated form. Consult the current OACIQ forms and bulletins for the exact requirement.",
  },
  {
    question:
      "How can the recent changes to the REBA be aligned with the issue of efficient cause of sale?",
    answer:
      "The concept of efficient cause of sale (finding the buyer) must be applied in a manner consistent with the prohibition of double representation and the requirement for a BCP. Compensation and recognition of the efficient cause must be determined in accordance with the contract terms and REBA as amended. Refer to regulator guidance on this point.",
  },
  {
    question:
      "What forms should be used to represent the seller (or lessor) and the buyer (or lessee)?",
    answer:
      "The forms approved by the OACIQ for brokerage contracts to sell, to purchase (BCP), and for leasing must be used as in effect from June 10, 2022. Use the current versions available on the OACIQ website or through your agency.",
  },
  {
    question:
      "Why have a form for non-exclusive brokerage contracts to sell? Are all brokers now required to offer non-exclusive brokerage?",
    answer:
      "The non-exclusive brokerage contract to sell gives sellers the option to list with more than one agency. Whether brokers must offer non-exclusive brokerage depends on REBA and the regulator’s requirements. The form exists to standardise and disclose the terms when parties choose this option. Consult OACIQ guidance for current obligations.",
  },
];

export function DoubleRepresentationFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-6 space-y-2">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium text-slate-200 hover:bg-slate-800/50 transition-colors"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
              id={`faq-question-${index}`}
            >
              <span className="flex-1">
                {index + 1}. {item.question}
              </span>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {isOpen ? "Close" : "Open drawer"}
              </span>
            </button>
            <div
              id={`faq-answer-${index}`}
              role="region"
              aria-labelledby={`faq-question-${index}`}
              className={`border-t border-slate-800 transition-all ${isOpen ? "block" : "hidden"}`}
            >
              <div className="px-4 py-4 text-slate-400 text-sm leading-relaxed">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
