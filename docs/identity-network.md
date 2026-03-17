# Global Real Estate Identity Network

**LECIPM Platform**  
*Persistent identity layer for properties, owners, brokers, and listing authorities*

---

## 1. Purpose

The **Global Real Estate Identity Network** gives the platform a long-term identity layer so the same real-world entities are recognized across time, listing types, and markets. It:

- **Reduces fraud** by making it harder to create new accounts and repeat bad behavior
- **Improves verification** by tying listings to verified ownership and broker authority
- **Preserves history** for ownership and broker authorization
- **Supports analytics and AI** with identity-aware data (trust scoring, clustering, valuations)

The network connects:

- **Properties** (existing `PropertyIdentity`)
- **Owners** (`OwnerIdentity` + ownership history)
- **Brokers** (`BrokerIdentity` + authorization history)
- **Organizations** (brokerages, property management companies)
- **Listing authorities** (why a given user may list a property)
- **Users** (via `IdentityLink`: user ↔ owner or broker identity)
- **Listings, transactions, bookings, valuations, fraud events, trust & safety**

It supports **sale**, **long-term rental**, and **short-term rental (BNHub)** listings.

---

## 2. Core Identities

| Identity | Table | Purpose |
|----------|--------|---------|
| **Property** | `PropertyIdentity` (existing) | One stable identity per real property (cadastre, address, geo, type). |
| **Owner** | `OwnerIdentity` | Persistent owner entity: legal name, normalized name, verification status, primary source. |
| **Broker** | `BrokerIdentity` | Persistent broker: legal name, license number, brokerage, regulator (e.g. OACIQ). |
| **Organization** | `OrganizationIdentity` | Brokerages, property management companies, legal entities. |
| **Listing authority** | `ListingAuthority` | Links a property to the reason a listing is allowed (owner self-listed, broker authorized, etc.). |

---

## 3. Relationships

- **Property** ↔ **Owner**: `OwnershipHistory` (property_identity_id, owner_identity_id, source, effective dates).
- **Property** ↔ **Broker**: `BrokerAuthorizationHistory` (property, broker, optional owner, authorization source, dates).
- **Listing** ↔ **Authority**: `ListingAuthority` (property, authority_type, owner/broker/organization, document ref, start/end, status).
- **User** ↔ **Owner/Broker**: `IdentityLink` (identity_type, identity_id, user_id, link_status).

These align with the **Global Property Data Graph**: OWNED_BY, BROKERED_BY, and listing authority feed into the graph.

---

## 4. Identity Resolution

Resolution decides whether two records refer to the same real-world entity.

- **Owner**: Normalized legal name, optional document/land-register name; outcomes: `exact_match`, `probable_match`, `manual_review_required`, `mismatch`.
- **Broker**: License number (strong signal), legal name, brokerage; same outcomes.
- **Organization**: Normalized legal name; same outcomes.

Implementation: `lib/identity-network/resolution.ts` and `normalize.ts` (legal name normalization).

---

## 5. Risk and Governance

- **Identity risk**: `IdentityRiskProfile` (identity_type, identity_id, risk_score, risk_level, risk_reasons, investigation_status). Used for owners, brokers, and organizations.
- **Events**: `IdentityEvent` records merges, risk marks, and review resolutions for audit.
- **Admin**: Search, investigation view, merge identities, mark risk, resolve review. Sensitive actions are logged and access-controlled.

---

## 6. Integration

- **Property verification**: Listing authority and ownership/broker history support “who may list” and verification checks.
- **Anti-fraud**: Identity risk and repeated links (same broker/owner across fraud cases) feed into fraud scoring and blocks.
- **Trust & safety**: Incidents and disputes can be tied to owner/broker identities for patterns and restrictions.
- **Property graph**: `getPropertyGraph` includes `OwnerIdentity` and `BrokerIdentity` from ownership and broker authorization history as OWNER and BROKER nodes with OWNED_BY and BROKERED_BY edges.
- **Transactions / bookings**: Linked via property and user; identity layer adds persistent owner/broker context for analytics and risk.

---

## 7. APIs

**Public (authenticated)**

- `GET /api/identity-network/property/:propertyIdentityId` – Full identity view (ownership, broker auth, listing authorities).
- `GET /api/identity-network/owner/:ownerIdentityId`
- `GET /api/identity-network/broker/:brokerIdentityId`
- `GET /api/identity-network/organization/:organizationIdentityId`
- `POST /api/identity-network/owner/resolve` – Resolve owner (body: legalName, documentOwnerName?, existingOwnerIdentityId?).
- `POST /api/identity-network/broker/resolve` – Resolve broker (body: legalName, licenseNumber, brokerageName?, existingBrokerIdentityId?).
- `POST /api/identity-network/organization/resolve` – Resolve organization (body: legalName, existingOrganizationIdentityId?).
- `POST /api/identity-network/property/:id/link-owner` – Body: ownerIdentityId, source.
- `POST /api/identity-network/property/:id/link-broker` – Body: brokerIdentityId, authorizationSource, ownerIdentityId?, verificationStatus?.
- `POST /api/identity-network/property/:id/create-authority` – Body: authorityType, ownerIdentityId?, brokerIdentityId?, organizationIdentityId?, documentReference?, startDate, endDate?, status?, verificationStatus?.
- `GET /api/identity-network/property/:id/ownership-history`
- `GET /api/identity-network/property/:id/authorization-history`
- `GET /api/identity-network/identity/:type/:id/risk` – type: OWNER | BROKER | ORGANIZATION.

**Admin**

- `GET /api/admin/identity-network/search` – Query: q, type=property|owner|broker|organization, limit.
- `GET /api/admin/identity-network/investigation/:id` – Full identity details (property, owner, broker, or organization by id).
- `POST /api/admin/identity-network/merge-identities` – Body: identityType (OWNER|BROKER), primaryIdentityId, duplicateIdentityId.
- `POST /api/admin/identity-network/mark-risk` – Body: identityType, identityId, riskScore, riskLevel, riskReasons?, investigationStatus?.
- `POST /api/admin/identity-network/resolve-review` – Body: identityType (OWNER|BROKER), identityId, verificationStatus (VERIFIED|REJECTED).

---

## 8. Database (Prisma)

Main models:

- `OwnerIdentity`, `BrokerIdentity`, `OrganizationIdentity`
- `ListingAuthority` (property, authority_type, owner/broker/org, document_reference, start_date, end_date, status, verification_status)
- `IdentityLink` (identity_type, identity_id, user_id, link_status)
- `OwnershipHistory` (property_identity_id, owner_identity_id, source, effective_start_date, effective_end_date, verification_status, notes)
- `BrokerAuthorizationHistory` (property_identity_id, broker_identity_id, owner_identity_id?, authorization_source, start_date, end_date, verification_status)
- `IdentityRiskProfile` (identity_type, identity_id, risk_score, risk_level, risk_reasons, investigation_status)
- `IdentityEvent` (identity_type, identity_id, event_type, event_data, created_by, created_at)

Run migrations after schema changes:

```bash
cd apps/web-app && npx prisma migrate dev --name add_identity_network
```

---

## 9. Security and Governance

- Identity data is sensitive; access is role-based. Admin search, merge, mark-risk, and resolve-review require auth.
- Admin actions are logged via `IdentityEvent` and audit trails where applicable.
- Merge and risk decisions are traceable (createdBy, eventData).

---

## 10. Tests

- `lib/identity-network/__tests__/normalize.test.ts` – Legal name normalization.
- `lib/identity-network/__tests__/resolution.test.ts` – Owner, broker, organization resolution outcomes.
- `lib/identity-network/__tests__/identity-service.test.ts` – Create owner/broker/organization (mocked Prisma).

Run:

```bash
cd apps/web-app && npx vitest run lib/identity-network
```
