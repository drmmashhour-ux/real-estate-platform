# ImmoContact

## Purpose

Communication hub — real-time chat, AI assistant, broker assignment, lead scoring, and automated follow-ups. ImmoContact is the central nervous system for all person-to-person and AI-assisted conversations on the platform.

## Owned Routes

| Route | Description |
|---|---|
| `/contact` | Contact page & inquiry form |
| `/messages` | Messaging inbox |
| `/embed/ai-chat` | Embeddable AI chat widget |

## Owned Data Models

| Model | Description |
|---|---|
| `Conversation` | Thread linking participants and messages |
| `Message` | Individual chat message |
| `LeadCommMessage` | Communication record tied to a lead |
| `LeadScore` | Computed lead quality score |

## Dependencies

- **Core** — authentication and user identity
- **AI layer** — assistant routing and response generation

## What Does NOT Belong Here

- Booking flows or stay management (→ **BNHub**)
- Legal forms, contracts, or signature workflows (→ **Forms**)
- Admin monitoring, fraud detection, or system health (→ **DrBrain**)
