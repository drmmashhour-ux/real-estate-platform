# Forms

## Purpose

Legal forms, electronic signatures, OACIQ documents, seller declarations, and notary workflow. Forms manages the entire lifecycle of real estate legal paperwork from drafting through execution.

## Owned Routes

| Route | Description |
|---|---|
| `/forms` | Forms dashboard & template library |
| `/legal/seller-declaration-property` | Seller property declaration form |
| `/contracts` | Active contracts list |
| `/client-documents` | Client-facing document portal |

## Owned Data Models

| Model | Description |
|---|---|
| `Contract` | Legal contract record with status and parties |
| `SignatureEnvelope` | Signature request wrapper with tracking |
| `SellerDeclaration` | Structured seller declaration data |
| `LegalForm` | Reusable legal form template |

## Dependencies

- **Core** — authentication and user identity
- **Compliance** — required-forms validation and regulatory checks
- **Homes** — listing context for property-linked documents

## What Does NOT Belong Here

- Property search, listings, or marketplace pages (→ **Homes**)
- Pricing logic or stay management (→ **BNHub**)
- Investment analysis, ROI tools, or portfolio tracking (→ **Invest**)
