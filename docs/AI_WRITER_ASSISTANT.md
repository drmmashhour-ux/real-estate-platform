# AI Writing Assistant

## Usage

- **API:** `POST /api/ai/write` with JSON:
  - `prompt` (string)
  - `type`: `listing` | `message` | `mortgage` | `general`
  - `action` (optional): `generate` | `professional` | `shorter` | `persuasive` | `translate_fr` | `translate_en`
  - `listingContext` (optional, for `type=listing` + `action=generate`): `{ propertyType, location, price, features }`

## Service

- `lib/ai/writer.ts` — `generateText(prompt, type, { action, listingContext })`
- Model: `gpt-4o-mini` when `OPENAI_API_KEY` is set; otherwise a short placeholder preview.

## Limits & admin

- Rate limit: ~80/hour per logged-in user, ~25/hour per IP (anonymous).
- Usage rows: `AiWriterUsageLog` → counts on **Admin → AI Control Center** (“AI Writing Assistant”).

## UI

- `components/ai/AiWriterToolbar.tsx` — spinner + “Generating…”
- Wired into: BNHub create/edit listing description, Contact form message, Mortgage lead notes.

Migration: `npx prisma migrate deploy` (table `ai_writer_usage_logs`).
