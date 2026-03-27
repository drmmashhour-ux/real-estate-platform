# Investment demo mode

Anonymous users can run the full **Analyze → Save → Compare → Track** loop without signing in.

## Routes

| Path | Behavior |
|------|----------|
| `/analyze` | Deal analyzer; **demo nav** when logged out. Saves go to `localStorage` key `lecipm_investment_demo_deals_v1`. |
| `/demo/dashboard` | Portfolio view backed by the same browser storage + **seeded sample deals** (3) on first visit. |
| `/demo/compare` | Side-by-side compare for demo deals (2–4). |
| `/demo` | Redirects to `/demo/dashboard`. |
| `/dashboard`, `/compare` | Still require login (real portfolio in DB). |

## Seeded data

On first load of `/analyze` or `/demo/*`, if storage is empty, **three** illustrative deals are inserted (Montreal, Laval, Toronto) with realistic price, rent, expenses, ROI, risk, and market labels.

## Signing in later

Demo data stays in the browser until cleared. Saving while logged in uses `/api/investment-deals` and the database. There is no automatic merge of demo storage into the account (by design for a simple MVP).
