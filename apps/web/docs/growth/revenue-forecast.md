# Revenue forecast (illustrative)

Internal **what-if** dollars from CRM shapes — **not GAAP**, not cash timing, **not** a quota or promise.

## Formula (when data is sufficient)

Let:

- \(L\) = leads created in the forecast window (`Lead.createdAt` in `[start, now)`).
- \(\bar{v}\) = mean of positive `dealValue ?? estimatedValue` on those leads; if missing, fallback mean on recent **won** rows.
- \(w\) = **capped win rate** = \(\min(0.42,\ \text{won}_{\text{baseline}} / \max(\text{entered}_{\text{baseline}},1))\) where baseline is the last **56+ days** (or \(4\times\) window, whichever is larger).

Then:

- **Central:** \(\mathbb{E} \approx L \times w \times \bar{v}\)
- **Conservative:** \(\mathbb{E} \times 0.62\)
- **Optimistic:** \(\min(\mathbb{E} \times 1.28,\ L \times \bar{v} \times 0.42)\)

If **any** of the following holds, numeric revenue is **withheld** (`insufficientData: true`):

- Fewer than **6** leads in the window
- Fewer than **15** leads entered in the baseline period
- Missing average deal value after both primary and won-row fallbacks

Warnings always explain withholding.

## Trend (`revenue-trend.service.ts`)

Composite growth rate:

\[
\frac{(L_{\text{cur}}+Q_{\text{cur}}) - (L_{\text{prior}}+Q_{\text{prior}})}{\max(L_{\text{prior}}+Q_{\text{prior}},\ 1)}
\]

where \(Q\) = qualified-or-better count in each window. **Momentum** is **up** / **flat** / **down** vs ±5% thresholds.

## Risk (`revenue-risk.service.ts`)

Tiered **low/medium/high** on:

- Drop-off proxy: \(1 - \text{qualified}/\max(L,1)\)
- Execution gap: \(1 - \text{accountability completion rate}\)
- Sparse pipeline / thin CRM counts

## Interpretation

- **Confidence** downgrades automatically when data-risk is high.
- Joint **closingProbability** (pipeline block) is only populated when sample depth allows — otherwise `null`.

## Monitoring

Prefix **`[revenue-forecast]`** for builds and low-confidence tagging.
