# Trust & Safety Governance

**LECIPM Platform**  
*Operational policies and system behavior for fraud, scams, unsafe properties, harassment, and service disputes*

---

This document describes how the LECIPM platform (including the BNHub short-term rental module) handles trust and safety: fraudulent listings, scam activity, short-term rental disputes, unsafe conditions, harassment, guest and host misconduct, payout protection, enforcement actions, and appeals. It is intended for users, hosts, support staff, and compliance reference.

---

## 1. Fraud Listing Handling

The platform treats fraudulent or scam listings as a high priority. When a listing is suspected or confirmed to be fraudulent, the following process applies.

### What counts as fraud

Examples of fraud the platform addresses include:

- **Fake property** — Listing for a property that does not exist or is not rentable/saleable as described.
- **Fake or unauthorized ownership** — Lister is not the owner and has no valid authorization (e.g. broker mandate).
- **Unauthorized broker** — Person claims to act as broker without a valid license or mandate.
- **Stolen or misleading assets** — Use of photos, documents, or descriptions that are not legitimate or accurate.
- **Duplicate cadastre listing** — Same property offered under different identities or in a way that misleads about availability or ownership.
- **Manipulated documents** — Land register, ownership, or broker documents that are altered or falsified.
- **False address or identity** — Misrepresentation of location, identity, or legal capacity.

### Platform process

When fraud is detected or reported:

1. **Automatic freeze of suspicious listings**  
   Listings that meet risk thresholds (e.g. from the anti-fraud engine) are moved to **under investigation** or **frozen** status.

2. **Removal from public search**  
   Listings under investigation, frozen, rejected for fraud, or permanently removed are **not visible** in public search or booking flows.

3. **Investigation case**  
   An internal **listing investigation** is opened. The case records:
   - Fraud reason (e.g. fake owner, duplicate cadastre, stolen photos).
   - Who opened the case and when.
   - Resolution (restore, reject, suspend, ban) and notes.

4. **Pause of related transactions**  
   - **New bookings** are blocked for the listing.  
   - **Host payouts** for that listing’s bookings are held until the investigation is resolved.  
   - Guest funds are protected (see [Booking Protection](#2-booking-protection)).

5. **Review of verification and documents**  
   During investigation, the platform reviews (as applicable):
   - **Cadastre number** and consistency with the property.
   - **Ownership documents** (e.g. land register extract).
   - **Identity verification** of the lister (owner or broker).
   - **Broker license and authorization** when the lister acts as broker.

### Possible outcomes

After review, the platform may:

| Outcome | Description |
|--------|-------------|
| **Listing restored** | No fraud found; listing may be restored to draft or published. Payout holds for that listing are released according to policy. |
| **Listing rejected** | Listing is rejected for fraud; it remains non-visible and is not republishable in the same form. |
| **Account restricted** | User cannot publish new listings, withdraw funds, or perform certain actions until the restriction is lifted. |
| **Account suspended** | Temporary suspension of account and related listings. |
| **Permanent ban** | User is permanently banned; listings are permanently removed. Further enforcement (e.g. reporting to authorities) may apply where required by law. |

All outcomes are logged with reason codes, timestamps, and case references for auditability.

---

## 2. Booking Protection

The platform protects guests and their payments through escrow-style handling and dispute-related holds.

### Payment flow

- **Guest pays the platform** — Payment is collected by the platform, not paid directly to the host at the time of booking.
- **Temporary hold** — The host’s payout is **held** for a **protection window** (e.g. 24–48 hours after check-in) before it becomes eligible for release.
- **Payout release** — After the protection window, and provided there is no fraud investigation or open dispute, the host payout is released according to platform rules.

### Disputes and fraud

- **Disputes** — If a guest reports an issue (e.g. property not as described, unsafe conditions) within the allowed window, the host payout for that booking may be **paused** until the dispute is resolved.
- **Fraudulent listings** — If a listing is under fraud investigation or confirmed fraudulent, payouts for that listing’s bookings are **held**. Where the listing is confirmed fake or the stay cannot be honored, the platform will:
  - Trigger **refund** workflows for affected guests where appropriate.
  - Offer **relocation support** when policy and capacity allow.

These rules ensure guest funds are protected and not released to hosts while fraud or serious disputes are under review.

---

## 3. Short-Term Rental Disputes (BNHub)

When a short-term rental is not as described, unsafe, or the service is otherwise unsatisfactory, the following complaint and resolution process applies.

### Situations covered

Examples of issues that can be reported:

- Property **not as described**.
- **Unsafe conditions** (e.g. dangerous or uninhabitable).
- **Missing amenities** that were promised.
- **Misleading photos** or listing information.
- **Host unresponsive** (e.g. check-in or urgent issues).

### Workflow

1. **Guest reports the issue**  
   The guest submits a complaint from the trip/booking page, within the defined **reporting window** (e.g. within 24 hours of check-in). They can:
   - Choose a category (e.g. property not as described, cleanliness, unsafe, host unresponsive).
   - Provide a description and, when supported, upload photos, videos, or other evidence.

2. **Platform collects evidence**  
   The platform stores the complaint, evidence, and links to the booking and listing. For serious or safety-related issues, the case may be prioritized (e.g. urgent or emergency).

3. **Host response requested**  
   The host is asked to respond within a set deadline (e.g. 48 hours). Their response is recorded and considered in the investigation.

4. **Investigation**  
   The platform (support/trust & safety) reviews:
   - Listing description and photos.
   - Guest evidence and description.
   - Host response and any prior history.
   - Severity and category of the complaint.

5. **Resolution decision**  
   A resolution is issued and recorded (with reason and, where applicable, refund amount). The dispute status is updated (e.g. resolved_partial_refund, resolved_full_refund, resolved_relocation, host_suspended).

### Possible resolutions

| Resolution | When it may apply |
|-----------|---------------------|
| **No action** | Complaint not substantiated or outside policy. |
| **Partial refund** | Issue confirmed but stay continued (e.g. missing amenities, cleanliness). |
| **Full refund** | Serious mismatch, uninhabitable, or stay not honored. |
| **Relocation assistance** | Platform helps guest find alternative accommodation when policy allows. |
| **Listing suspension** | Listing is suspended due to repeated or serious issues. |
| **Host suspension** | Host account is restricted or suspended; all their listings may be suspended. |

Refunds and host payouts are updated according to the resolution (e.g. refund processed, payout held or released). Repeated or serious misconduct may trigger warnings, suspension, or permanent removal and are reflected in host accountability and risk history.

---

## 4. Trust & Safety Incident Management

Beyond disputes, the platform operates a **Trust & Safety incident** system for safety, abuse, and policy violations.

### Incident categories

Incidents are classified into categories such as:

- **unsafe_property** — Dangerous, uninhabitable, or severely misrepresented conditions.
- **harassment** — Harassment by another user.
- **abusive_behavior** — Abusive conduct (e.g. threats, intimidation).
- **illegal_activity** — Reports of illegal activity related to a listing or user.
- **unauthorized_party** — Unauthorized parties or nuisance (e.g. anti-party violations).
- **discrimination_report** — Discrimination by host or guest.
- **message_abuse** — Abusive, threatening, or policy-violating messages.
- **review_abuse** — Retaliation, coercion, or fake reviews.

Other categories (e.g. property_not_as_described, host_unresponsive, guest_misconduct, deceptive_listing_behavior, payment_or_extortion_related_issue) may also be used as defined in the system.

### Incident attributes

Each incident includes:

- **Severity level** — Low, medium, high, or emergency (e.g. unsafe property, illegal activity, serious harassment are treated as high or emergency).
- **Evidence** — Photos, screenshots, messages, documents, or videos (when supported), stored securely and access-restricted.
- **Investigation status** — e.g. submitted, under review, waiting for response, escalated, resolved, closed.
- **Enforcement action** — Any warning, restriction, freeze, hold, suspension, or ban taken in connection with the incident, with reason code and case reference.

High-severity and emergency incidents are escalated to the trust & safety queue and may trigger immediate listing freeze, payout hold, or account restriction as described in enforcement and emergency procedures.

---

## 5. Enforcement Actions

The platform applies **structured enforcement actions** when rules are violated or safety is at risk.

### Action types

Possible actions include:

| Action | Description |
|--------|-------------|
| **Warning** | Formal warning (e.g. listing or account warning). |
| **Temporary restriction** | Temporary booking or account restriction. |
| **Listing freeze** | Listing removed from search and new bookings blocked. |
| **Payout hold** | Host payout held for a booking or listing (e.g. dispute, safety, fraud). |
| **Account suspension** | Temporary suspension of the user account and related listings. |
| **Permanent account ban** | Permanent ban; listings permanently removed. |

Additional actions (e.g. permanent listing removal, requirement for additional verification, or manual review for future actions) may apply as defined in the system.

### Requirements for every action

- **Reason code** — Each action is tied to a defined reason code (e.g. fraud, unsafe property, harassment, policy violation).
- **Admin decision log** — Who took the action, when, and (where applicable) in the context of which incident or case.
- **Timestamp** — When the action was applied.
- **Case reference** — Link to the relevant incident, dispute, or investigation.

This ensures consistency, auditability, and the ability to review or appeal decisions.

---

## 6. Appeals Process

Users may **appeal** certain trust and safety decisions.

### Appealable actions

Appeals are available for decisions such as:

- Listing suspension.
- Account suspension.
- Payout hold.
- Permanent listing removal.

Specific appealability may depend on product and jurisdiction; the platform may extend or limit appealable actions as documented in-product or in terms.

### Appeal process

1. **User submits appeal**  
   The user submits an appeal with a reason and any supporting evidence, within the allowed time and through the designated flow (e.g. trust & safety appeals).

2. **Admin reviews evidence**  
   A trained reviewer (or panel) reviews the original case, the user’s appeal, and any new evidence. The review is logged.

3. **Final decision issued**  
   The platform issues a final decision: appeal **approved**, **rejected**, or **withdrawn**. The user is notified where applicable.

4. **Appeal result recorded**  
   The outcome is stored with the appeal (e.g. resolution note, reviewer, date) and linked to the original incident and action for audit.

Approved appeals may result in reversal of the action (e.g. listing restored, payout released, restriction lifted) as per platform policy.

---

## 7. Evidence Handling

Trust and safety decisions rely on **reliable and secure** evidence.

### Types of evidence

Evidence may include:

- **Photos** — e.g. property condition, safety issues, damage.
- **Screenshots** — e.g. messages, listings, reviews.
- **Messages** — In-platform messages linked to incidents or disputes.
- **Documents** — e.g. ownership, broker authorization, identity.
- **Videos** — When the platform supports video upload for reports.

### Requirements

- **Secure storage** — Evidence is stored in a secure, access-controlled environment.
- **Restricted access** — Access is limited to roles that need it for investigation, enforcement, appeal, or legal compliance.
- **Audit logging** — Access and material actions on evidence are logged for accountability and legal defensibility.

Evidence is retained in line with the platform’s data retention and legal hold policies.

---

## 8. AI Assistance

The platform may use **AI** to support trust and safety operations. The role of AI is **assistive**, not final decision-maker for high-risk outcomes.

### Where AI may assist

- **Fraud detection** — Flagging suspicious listings, patterns, or documents for human review.
- **Document verification** — Supporting checks on cadastre, ownership, or broker documents.
- **Complaint classification** — Suggesting incident or dispute category and severity.
- **Abusive message detection** — Flagging potentially abusive or policy-violating messages.
- **Dispute prioritization** — Helping order the support or trust & safety queue (e.g. by urgency or risk).

### Limits

- **AI does not make final enforcement decisions** — Warnings, suspensions, bans, payout holds, and listing removals are decided by humans following platform policy.
- **Human review is required** for high-risk cases (e.g. fraud, safety, harassment, account suspension, permanent ban).
- **Recommendations** from AI may be overridden by reviewers with reason and audit trail.

This keeps accountability and fairness with humans while using AI to improve speed and consistency of triage and support.

---

## 9. Transparency and User Trust

The platform provides **visible trust and safety features** so users can make informed choices.

### Examples

- **Verified property badge** — Indicates the listing has passed the platform’s property verification (e.g. cadastre, identity, location) where applicable.
- **Verified host badge** — Indicates the host has completed identity (or broker) verification as required.
- **Review system** — Guests can leave reviews; the platform may take action on review abuse (e.g. retaliation, fake reviews) as described in incident and enforcement sections.
- **Dispute resolution system** — Clear way to report issues, submit evidence, and receive a resolution within the defined workflow.
- **Safety reporting tools** — Ability to report unsafe property, harassment, abuse, illegal activity, and other incidents, with categories and severity.

Policies and help content (e.g. how disputes and appeals work) are made available to users where appropriate.

---

## 10. Platform Responsibility

### What the platform does

The platform will:

- **Investigate** reported safety, fraud, and policy issues using the processes described in this document.
- **Freeze** suspicious or non-compliant listings and block new bookings where appropriate.
- **Protect guest payments** through escrow-style holds and refund/relocation policies.
- **Enforce rules** in a consistent, documented way, with reason codes and case references.
- **Maintain audit logs** of investigations, enforcement actions, and appeals for accountability and legal defensibility.

### What the platform does not replace

The platform does **not** replace:

- **Legal authorities** — Users may need to contact police or other authorities for illegal activity or to pursue legal action.
- **Licensed real estate professionals** — In regulated markets (e.g. Québec, where real estate activity is regulated by the *Organisme d’autoréglementation du courtage immobilier du Québec* (OACIQ)), the platform does not substitute for licensed professionals where the law requires them.
- **Formal legal dispute processes** — When a matter requires courts, arbitrators, or regulators, users may need to use those channels in addition to or instead of platform processes.

Where the platform is required to report to authorities or to cooperate with regulators, it will do so in accordance with applicable law and policy.

---

## 11. Result: How the platform maintains trust and safety

Taken together, this governance describes how the platform:

| Goal | How it is achieved |
|------|---------------------|
| **Prevent fraud** | Verification (cadastre, identity, broker), anti-fraud signals, automatic freeze of high-risk listings, and investigation before restoration or enforcement. |
| **Protect guests** | Escrow-style payment hold, protection window, dispute-triggered payout pause, refunds and relocation for fraud or serious issues, and clear reporting and resolution flows. |
| **Enforce rules** | Structured enforcement (warnings, freezes, holds, suspensions, bans) with reason codes, case references, and admin logs. |
| **Resolve disputes** | Defined dispute workflow (report → evidence → host response → investigation → resolution) and clear resolution types (refunds, relocation, listing/host suspension). |
| **Maintain marketplace trust** | Incident management, evidence handling, appeals, transparency (badges, reviews, reporting), and human-led decisions for high-risk enforcement, with AI used only in an assistive role. |

This document may be updated as policies or systems change. For the latest technical behavior, refer to the platform’s trust & safety and fraud/dispute implementation (e.g. `lib/trust-safety`, dispute and investigation services, and related APIs).
