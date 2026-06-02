# Verdict reference

The `verdict` field collapses the full cognition stack into one of five values. The `score` (0-100) and `confidence` (0-1) give you the underlying granularity.

| verdict       | typical score | typical mandate.action | meaning |
|---------------|--------------|------------------------|---------|
| `strong_buy`  | 80-100       | `enter`                | High conviction. Regime, structure, momentum, and flow all aligned. Size hint at the upper end of the volatility-targeted band. |
| `buy`         | 60-79        | `enter`                | Favorable. At least three of the four major signal groups (momentum / flow / structure / volatility) point bullish, no major risk dominating. |
| `hold`        | 40-59        | `watch`                | Mixed. Drivers and risks roughly balanced. Wait for confirmation in one of the named invalidations. |
| `avoid`       | 20-39        | `avoid`                | Active negatives outweigh positives. Could be weak flow, distribution structure, contracting Base eco pulse, or headwind macro. |
| `drop`        | 0-19         | `avoid`                | Multiple structural risks. Often includes thin liquidity, distribution/markdown structure, weak data quality, or veteran pool with no turnover. |

`drivers` and `risks` are short narrative strings explaining which signals contributed. They are sanitized — no weights, thresholds, or internal priors are exposed.

## How to use the mandate

The mandate is an opinionated trade plan, not financial advice. Two usage patterns:

1. **Conviction filter**: only act on `strong_buy` or `buy` with `mandate.action = "enter"`. Use `entry_zone`, `stop_loss`, `size_hint_pct` directly.
2. **Signal-only**: ignore `mandate` and use `signals` + `context` + `comparables` to feed your own decision system. `mandate` is computed last and can be discarded.

## Confidence

`confidence` ∈ [0, 1] reflects data quality and regime certainty, not directional conviction. A `strong_buy` with `confidence = 0.6` is a high-conviction directional call on partially-estimated data (e.g. `flow.data_quality = "estimated"`); a `hold` with `confidence = 0.9` is a high-quality reading that genuinely sees no edge.
