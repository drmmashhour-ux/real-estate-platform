# Global Property Data Graph

**LECIPM Platform**  
*Unified property intelligence layer connecting properties, owners, brokers, listings, bookings, transactions, valuations, fraud, and market analytics*

---

## 1. Concept

The **Global Property Data Graph** is a graph-based intelligence layer that turns the platform into a long-term real-estate data asset. The graph connects:

- **Properties** (via `PropertyIdentity`)
- **Users** (owners, guests, buyers, sellers)
- **Brokers** (verified broker users)
- **Listings** (sale, long-term rental, short-term rental / BNHub)
- **Bookings** (BNHub)
- **Transactions** (sale/rent offers and deals)
- **Valuations** (AVM, rent estimates, STR revenue)
- **Markets** (city/municipality/province/country)
- **Fraud events** (scores, alerts, identity risk)
- **Safety incidents** (trust & safety)
- **Reviews** and **Payments**

Relationships are derived from existing relational tables (foreign keys) plus **semantic edges** stored in `PropertyGraphEdge` (e.g. `SIMILAR_TO`, `SAME_MARKET`, `IN_MARKET`).

---

## 2. Core Graph Nodes

| Node type       | Source / key fields |
|-----------------|----------------------|
| **PROPERTY**    | `PropertyIdentity`: id, propertyUid, cadastreNumber, normalizedAddress, municipality, province, country, propertyType, coordinates |
| **USER**        | `User`: id, role, accountStatus |
| **OWNER**       | `PropertyIdentityOwner`: owner id, ownerName, source, isCurrent |
| **BROKER**      | Broker user + `BrokerVerification` |
| **LISTING**     | `ShortTermListing` (and future sale/LTR): id, listing_type, status, verification_status |
| **BOOKING**     | `Booking`: id, status, date range, total_price |
| **TRANSACTION** | `RealEstateTransaction`: id, status, offer_price |
| **VALUATION**   | `PropertyValuation`: id, valuation_type, estimated_value, confidence_score |
| **MARKET**      | `Market`: id, city, municipality, province, country, slug |
| **FRAUD_EVENT** | `PropertyFraudScore`, `PropertyFraudAlert`, `PropertyIdentityRisk` |
| **SAFETY_INCIDENT** | `TrustSafetyIncident` (via listing) |
| **REVIEW**      | `Review` |
| **PAYMENT**     | `Payment` |

---

## 3. Core Graph Edges

Edges are either **derived** from FKs or **stored** in `PropertyGraphEdge`:

| Edge type           | From → To        | Source |
|---------------------|------------------|--------|
| HAS_LISTING         | PROPERTY → LISTING | FK on ShortTermListing.propertyIdentityId |
| CREATED_BY          | LISTING → USER   | ShortTermListing.ownerId |
| HAS_FRAUD_EVENT     | LISTING / PROPERTY → FRAUD_EVENT | PropertyFraudScore, PropertyFraudAlert, PropertyIdentityRisk |
| HAS_TRANSACTION     | PROPERTY → TRANSACTION | RealEstateTransaction.propertyIdentityId |
| BUYER / SELLER / BROKER | TRANSACTION → USER | RealEstateTransaction.buyerId, sellerId, brokerId |
| HAS_VALUATION       | PROPERTY → VALUATION | PropertyValuation.propertyIdentityId |
| OWNED_BY            | PROPERTY → OWNER | PropertyIdentityOwner |
| IN_MARKET           | PROPERTY → MARKET | PropertyGraphEdge (synced by `syncMarketForProperty`) |
| SIMILAR_TO          | PROPERTY → PROPERTY | PropertyGraphEdge (e.g. from comparables) |
| SAME_AREA / SAME_MARKET | PROPERTY → PROPERTY or MARKET | PropertyGraphEdge |

---

## 4. Property Lifecycle Tracking

Lifecycle is captured in:

- **PropertyIdentityEvent** — eventType: identity_created, listing_linked, listing_rejected, verification_completed, fraud_flag_added, ownership_changed, etc.
- **Listing** create/update and **Transaction** / **Valuation** creation.

The API **GET /api/property-graph/property/:propertyIdentityId/history** returns a unified timeline (events + listing/transaction/valuation timestamps).

---

## 5. Ownership and Broker Relationship Mapping

- **Ownership**: `PropertyIdentityOwner` (ownerName, ownerSource, isCurrent) and listing `ownerId` link properties to users.
- **Brokers**: `BrokerVerification` and `RealEstateTransaction.brokerId` link brokers to transactions and thus to properties.
- **Rejected listing attempts** and **ownership change history** are reflected in `PropertyIdentityEvent` and listing status/history.

The graph supports:
- Blocking fake relisting (same cadastre, different unverified owner).
- Detecting suspicious broker patterns (e.g. many rejected properties).
- Preserving history when ownership or broker changes.

---

## 6. Listing History

For each property identity, the system tracks:

- All **short-term (BNHub)** listings over time (via `ShortTermListing.propertyIdentityId`).
- Who created them (ownerId), verification status, and which triggered fraud alerts or disputes.

Sale and long-term rental listings can be added when those listing types are introduced; the same graph model applies.

---

## 7. Fraud and Safety Graph

The graph is used to:

- Link **same cadastre** to multiple listings/users (duplicate detection).
- Link **same broker** to many transactions and (where applicable) rejected or flagged properties.
- Link **same user** to many suspicious properties or incidents.
- Link **same property** to repeated safety incidents (via listings → TrustSafetyIncident).

APIs:

- **GET /api/property-graph/property/:id/fraud-signals** — listing fraud scores/alerts + identity risk.
- **GET /api/property-graph/property/:id** — full graph including FRAUD_EVENT nodes and HAS_FRAUD_EVENT / HAS_SAFETY_INCIDENT edges where applicable.

---

## 8. Valuation and Market Intelligence

- **Property → Valuations**: `PropertyValuation` (sale, long_term_rental, short_term_rental, investment) with estimates and confidence.
- **Property → Market**: `Market` table + `IN_MARKET` edge (synced by `syncMarketForProperty`).
- **Comparables**: `SIMILAR_TO` edges can be written when AVM or comparables logic runs (e.g. via `linkSimilarProperties`).

APIs:

- **GET /api/property-graph/property/:id/valuations**
- **GET /api/property-graph/market/:marketId** — market plus listing/property counts.

---

## 9. Data Storage

- **Transactional data**: Existing Prisma models (PropertyIdentity, ShortTermListing, Booking, Payment, RealEstateTransaction, PropertyValuation, etc.) remain the source of truth.
- **Graph representation**: Assembled **on read** by the property-graph service (joins + optional `PropertyGraphEdge` for semantic edges).
- **Semantic edges**: Stored in **PropertyGraphEdge** (fromEntityType, fromEntityId, toEntityType, toEntityId, edgeType, metadata).
- **Markets**: Stored in **Market**; created on demand via `getOrCreateMarket` and linked via IN_MARKET edges.

No separate graph DB is required; the design is graph-ready so that a dedicated graph store can be added later if needed.

---

## 10. Graph Update Pipeline

Updates happen when:

- **Property identity created** — call `syncMarketForProperty(propertyIdentityId)` to ensure Market and IN_MARKET edge exist.
- **Listing submitted / verified / rejected** — no extra graph table write; graph reflects current FKs. Optionally append `PropertyIdentityEvent`.
- **Booking / payment / valuation / fraud / safety incident** — graph reflects current state on next read.
- **Transaction advances** — same.
- **Comparables or AVM run** — call `linkSimilarProperties(propA, propB, { score, source })` to add SIMILAR_TO edges.

Support:

- **Event-driven**: Call `syncMarketForProperty` (and optionally `linkSimilarProperties`) from application code when a property is created or linked.
- **Scheduled**: A job can periodically ensure all properties with identity have IN_MARKET edges and refresh SIMILAR_TO from latest valuations.

---

## 11. APIs

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/property-graph/property/:propertyIdentityId | Full graph (nodes + edges) for property |
| GET | /api/property-graph/property/:propertyIdentityId/history | Lifecycle history |
| GET | /api/property-graph/property/:propertyIdentityId/relations | Owners, listings, transactions, valuations, fraud, incidents |
| GET | /api/property-graph/property/:propertyIdentityId/listings | All listings for property |
| GET | /api/property-graph/property/:propertyIdentityId/valuations | All valuations |
| GET | /api/property-graph/property/:propertyIdentityId/fraud-signals | Fraud scores, alerts, identity risk |
| GET | /api/property-graph/user/:userId/network | User’s listings, bookings, transactions, properties |
| GET | /api/property-graph/broker/:brokerId/network | Broker’s transactions, properties, activity |
| GET | /api/property-graph/market/:marketId | Market + counts (marketId or slug) |

**Admin:**

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/admin/property-graph/search?q=&type=property\|user\|market | Search properties, users, markets |
| GET | /api/admin/property-graph/property/:propertyIdentityId?include=graph,relations | Graph + relations |
| GET | /api/admin/property-graph/investigation/:propertyIdentityId | Graph, relations, fraud signals, history for investigations |

---

## 12. Security and Access Control

- All endpoints require an authenticated user (getGuestId()). In production, restrict admin routes to admin/support roles.
- Sensitive ownership and broker data should be gated by role; limit PII in graph responses as needed.
- Admin graph search and investigation access should be logged for audit.

---

## 13. AI Integration

The graph can feed:

- **Fraud detection** — same cadastre / same user / same broker patterns.
- **Valuation** — comparables (SIMILAR_TO), market node, valuation history.
- **Host/broker risk** — user and broker network, fraud and safety incident links.
- **Investor analytics** — property history, valuations, market, comparable set.

Use graph relationships as structured features for models while keeping writes to the graph (e.g. SIMILAR_TO) consistent via the sync pipeline.

---

## 14. Result

The Global Property Data Graph allows the platform to:

- Treat every property as a **long-term data asset** with a single identity and full history.
- **Connect** owners, brokers, listings, bookings, transactions, valuations, fraud, and safety in one queryable structure.
- **Detect** fraud and suspicious relationship patterns (duplicate cadastre, broker/user clusters).
- **Improve** valuations and investor analytics via markets and comparables.
- **Preserve** full property lifecycle and listing history.

Implementation lives under `lib/property-graph/` (types, graph-service, sync) and `app/api/property-graph/` and `app/api/admin/property-graph/`.
