# Deal room client portal (V1, safe / limited)

## What this is

A **read-first, tightly permissioned** view for **selected external participants** on a **single deal room**. Access is **explicit** (portal must be enabled per participant) and **revocable** (disable clears the portal token).

## What clients can see

Only data that passes **portal visibility filters**:

- **Status** — high-level room status label (no internal ops detail).
- **Tasks** — rows with `visibility === "portal"` (legacy/undefined counts as **internal**, not shown).
- **Document checklist** — requirements with **`portalShared === true`** only.
- **Meetings** — rows with **`portalVisible === true`** only (legacy default: hidden).
- **Activity** — **sanitized labels** only; sensitive/internal activity types are omitted.
- **Notes** — **`audience === "portal"`** only (legacy/undefined counts as **internal**, not shown).

## What clients cannot see

- Internal notes, internal tasks, non–portal-shared checklist rows, non–portal-visible meetings.
- Raw activity summaries that expose broker/operator wording (mapped to safe labels).
- Admin/operator tooling, room lists, other rooms, or broad discovery.

There is **no** payment, escrow, or legal-signature flow in the portal.

## Access model

- **Portal disabled** → no API access (401).
- **Opaque token** per participant, scoped to **`roomId` + token`** (random UUID-derived string; not enumerable).
- Portal HTTP responses use **`Cache-Control: private, no-store`** so responses are not cached by shared caches.

Enable/disable and capability changes are internal-only APIs (`PATCH …/participants/…/portal`), authenticated as Immo deal room actors.

## Uploads

- Allowed only when the participant has **`upload_documents`** and the requirement is **`portalShared`** and in an upload-eligible status.
- Attachments create **internal reviewable** documents (`uploadedBy: portal:…`); statuses move to **received / under_review** paths — **not** auto-approved.

## Limited comments

Optional **`add_note_limited`** creates notes with **`audience: portal`** only, separate from internal notes.

## Revocation

Disabling portal access clears **`portalToken`**; existing links stop working immediately.

## V1 limits

Conservative defaults: read-first, upload only where explicitly allowed, no risky state transitions from the portal, no cross-room access.
