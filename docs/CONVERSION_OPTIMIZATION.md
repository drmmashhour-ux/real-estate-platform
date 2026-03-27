# Conversion & retention (investment funnel)

## Tracked funnel (TrafficEvent, last 30 days in admin `/admin/insights`)

| Stage | Event |
| --- | --- |
| Home visits | `page_view` on `/` (distinct sessions) |
| Visits → Analyze | `investment_analyze_cta_click` (+ legacy `investment_analyze_click` with `ctaKind`) |
| Analyze → Run | `investment_analyze_run` (+ legacy analyze_click with `city`/`mode`) |
| Run → Save | `investment_deal_saved` |
| Save → Dashboard | `investment_dashboard_visit` |

Admin **Insights engine** surfaces counts and **biggest drop-off** between stages (relative % loss).

## Session flow hints

- `investment_funnel_step` — emitted on navigation (`InvestmentFunnelLogger`) for core paths (home, analyze, dashboard, compare, deal).
- No third-party session replay; data lives in `traffic_events`.

## Micro-feedback

- `micro_feedback_helpful` with `meta.helpful` = `"true"` \| `"false"` and `meta.context` (e.g. `analyze_results`, `after_save`, `dashboard_portfolio`).
- Aggregated in admin funnel section (yes/no counts).

## UX hooks

- Homepage: prominent **Start Free Analysis** + “Try it in 10 seconds — no signup required”.
- Analyze: primary **Save** card above long results; “Was this helpful?” after results and after save.
- Dashboard: one-deal nudge → `/analyze`; two+ deals → compare CTA; helpful prompt when exactly one deal.
