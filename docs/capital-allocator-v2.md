# BNHub Capital Allocator V2 — Investor Decision Engine

The V2 upgrade transforms the deterministic allocator into an intelligent decision system for portfolio management.

## Key Components

### 1. Portfolio Insight Engine (`capital-portfolio-insight.service.ts`)
Analyzes the current allocation plan and underlying metrics to identify:
- **Top Contributors**: Listings driving the most gross revenue.
- **Underperformers**: Assets with low occupancy or high operational risk.
- **Growth Potential**: Listings with high uplift signals and strong AI recommendations.
- **Risk Alerts**: Immediate flags for critical operational or occupancy issues.

### 2. Scenario Simulator (`capital-scenario.service.ts`)
Allows investors to project the impact of capital shifts before committing.
- **Inputs**: Additional budget and reallocation strategy (Aggressive, Conservative, Balanced).
- **Projections**: Projected revenue impact and change in portfolio risk profile.

### 3. Learning Loop (`capital-learning.service.ts`)
Tracks the delta between projected and real performance after an allocation is applied. 
- Logs results to `CapitalAllocationLog`.
- Adjusts scoring weights (via `capital-allocation-weights.service.ts`) when performance exceeds or lags thresholds (e.g., increasing `upliftWeight` on success).
- Persists user-specific or global weights to the `AutonomyRuleWeight` table under the `CAPITAL_ALLOCATOR` domain.
- Provides success rate analysis for strategies.

### 4. Recommendation Engine (`capital-recommendation.service.ts`)
Generates human-readable, actionable advice:
- "Increase investment in X" (based on priority and capacity).
- "Reduce spend on Y" (due to high risk).
- "Pause Z" (due to severe occupancy issues).
- Includes reason and confidence score for each recommendation.

## API Endpoints

- `GET /api/capital-allocator/insights`: Returns top contributors, underperformers, high-growth opportunities, and risk alerts.
- `GET /api/capital-allocator/recommendations`: Returns actionable investment advice with confidence scores.
- `POST /api/capital-allocator/simulate`: Projects impact of budget/strategy changes on revenue and risk.
- `GET /api/mobile/investor/capital-allocator/summary`: Lightweight summary for mobile alerts.

## UI Integration
The investor dashboard now includes:
- **Portfolio Overview**: Visual summary of top contributors.
- **Top Opportunities**: Listings with high growth potential based on uplift.
- **Risk Alerts**: Immediate flags for critical operational or occupancy issues.
- **Actionable Recommendations**: High-confidence AI cards.
- **Interactive Simulator**: Real-time projection tool for budget planning.
