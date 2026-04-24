# Investor Fundraising System

Internal system for managing the BNHub / LECIPM fundraising pipeline.

## Goal
Streamline investor outreach, track stage progression, and monitor capital raising performance.

## Core Models
- **Investor**: Represents an individual or institutional investor.
- **InvestorInteraction**: Logs emails, calls, and meetings.
- **InvestorDocument**: Stores pitch decks, financials, and legal docs.

## Pipeline Stages
1. **NEW**: Initial discovery or referral.
2. **CONTACTED**: First outreach sent.
3. **INTERESTED**: Initial meeting or deck review completed.
4. **NEGOTIATING**: Term sheet or active due diligence.
5. **CLOSED**: Capital committed or received.

## Security
- Access is restricted to `ADMIN` and `FOUNDER` roles via `requireAdmin()`.
- Deterministic logging of all updates and creations.

## Usage
- Access the dashboard at `/dashboard/admin/investors`.
- Create new investors via `POST /api/investors`.
- Log interactions to maintain a clear audit trail.

## Disclaimer
This system is for operational tracking only and does not constitute financial, legal, or tax advice.
