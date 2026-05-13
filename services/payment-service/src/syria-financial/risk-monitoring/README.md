# Syria Risk Monitoring Module

Passive fraud and risk foundation for future Syrian payments.

- Detects duplicate payment attempts, velocity, suspicious IPs, repeated failures, and provider anomalies.
- Requires `FEATURE_SYRIA_RISK_ENGINE=true`; otherwise it returns no signals.
- Always emits `passiveOnly: true` and does not block users.
- Designed as the input layer for a future rules engine.
