# Analytics queries

Heavy read aggregations for admin KPIs live in `services/admin-analytics-service.ts`.
Split raw SQL or reusable `$queryRaw` fragments here when individual queries grow large.
