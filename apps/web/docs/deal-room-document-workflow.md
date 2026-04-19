# Deal room document workflow (V1)

Structured **checklists** for operators and brokers — **not** e‑signature, **not** legal closing automation, **not** payments.

See also: [`deal-room-system.md`](./deal-room-system.md)

## What it does

- **Categories** organize rows (`identity`, `property`, `offer`, `broker`, `financial`, `support`, `other`).
- Each **requirement** has an explicit **status** through its lifecycle (`missing` → `requested` → `received` → `under_review` → `approved` / `rejected`, plus `expired`).
- **Packet summary**: counts of required items, received (material on file), approved (internal review passed), missing (required but not approved), and **completion rate** (approved ÷ required).
- **Templates** (`buyer_lead`, `broker_listing`, `property_review`) seed operational rows — not legal packs.
- **Attachments** link a checklist row to an existing deal-room document row or create a new link/placeholder row.
- **Activity feed** records creates, status changes, and attachments (`doc_requirement_*` activity types).

Persistence lives in the same JSON store as deal rooms (`documentRequirements` array on `DealRoomDocV1`).

## Categories

| Category   | Typical use (operational)      |
|-----------|---------------------------------|
| identity  | Internal identity references    |
| property  | Factsheets, listing refs        |
| offer     | Draft / negotiation notes       |
| broker    | Broker card / disclosure notes  |
| financial | Summary notes (not wiring $)    |
| support   | Correspondence / timeline notes |
| other     | Misc.                           |

## Statuses

| Status        | Meaning                          |
|---------------|----------------------------------|
| missing       | Not yet chased                   |
| requested     | Asked for                        |
| received      | Something attached / on file    |
| under_review  | Ready for internal review        |
| approved      | Accepted by internal reviewer    |
| rejected      | Needs rework                     |
| expired       | No longer expected / stale       |

## Packet completeness

- **Completion rate** = approved required items ÷ total required items (0 if none required).
- **Missing required items** block lists every **required** row whose status is **not** `approved` — operators use this as the chase list until the packet is review-ready internally.

## Review rules (V1)

- **Approve** and **reject** are limited to **platform admins** and **internal operator roles** (`CONTENT_OPERATOR`, `LISTING_OPERATOR`, `OUTREACH_OPERATOR`, `SUPPORT_AGENT`).
- Brokers and mortgage brokers can edit rows, attach links, move statuses up to **`under_review`**, but cannot approve/reject in V1 unless they hold an operator/admin role.
- There is **no external reviewer portal** in this pass — review is **internal-first**.

## What V1 does NOT do

- No PDF assembly, no signature capture, no notary routing.
- No encryption class or retention policy beyond the existing JSON store.
- No automated email asking clients for documents.
- Approvals are **operational** markers only — not regulatory sign-off.

## Monitoring

`deal-room-document-monitoring.service.ts` logs with prefix **`[deal-room:documents]`** (never throws).

## Example flow

1. Create or open an ImmoContact deal room (`/dashboard/immo-deal-rooms`).
2. **Apply checklist template** matching context (e.g. lead → `buyer_lead`).
3. Use **Mark requested** / **Attach link** / status buttons to progress rows.
4. Internal operator uses **Approve** when satisfied — watch **packet complete** and **missing required items** clear.
