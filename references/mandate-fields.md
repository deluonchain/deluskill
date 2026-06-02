# delu-oracle — Tactician Mandate Fields

The `mandate` block is the actionable output: where to enter, where to stop, how much to size, and over what horizon. It is regenerated on every call and reflects current price, ATR, regime, and confidence.

## Fields

| Field | Type | Description |
|---|---|---|
| `entry_zone` | [number, number] | Lower/upper bound for entry. ATR-based — typically current price ± 0.25 × ATR. |
| `stop_loss` | number | Hard invalidation price. 2 × ATR below entry, with a 7% absolute floor as fallback when ATR data is thin. |
| `size_hint_pct` | number | Suggested position size as % of portfolio. Kelly-quarter formula tilted by regime and confidence. Clamped to `[0.5, 10.0]`. |
| `horizon` | string | Time-to-target window. Regime-keyed (e.g. `4h-24h` for `BULL_TREND`, `1h-4h` for `BULL_CHOP`, `none` for `DEAD`). |
| `invalidations` | string[] | English-form conditions that void the mandate (structure break, regime flip, liquidity collapse, etc.). |

## Sizing Formula

```
size_hint_pct = clamp(
  base_size * regime_tilt * (0.5 + 0.5 * confidence),
  0.5,
  10.0
)
```

Where:
- `base_size` = 2.5% (the neutral starting point)
- `regime_tilt` ∈ `{BULL_TREND: 1.5, BULL_CHOP: 1.0, MIXED: 0.7, BEAR_TREND: 0.4, BEAR_CAPITULATION: 0.6, BASE_DECOUPLED: 1.2, DEAD: 0.0}`
- `confidence` ∈ `[0, 1]` from the top-level response

A `DEAD` regime always returns `size_hint_pct: 0` and `horizon: "none"` — the mandate is informational only.

## Stop Loss Logic

1. Primary: `entry_mid - 2 × ATR` where `ATR` comes from 1h OHLCV.
2. Fallback: if ATR data is unavailable or absurdly thin, use `entry_mid * 0.93` (7% stop floor).
3. Never tighter than 3% from entry to avoid noise stops on Base-eco volatility.

## Horizon Keys

| Regime | Horizon |
|---|---|
| `BULL_TREND` | `4h-24h` |
| `BULL_CHOP` | `1h-4h` |
| `BASE_DECOUPLED` | `2h-12h` |
| `MIXED` | `2h-8h` |
| `BEAR_TREND` | `1h-3h` |
| `BEAR_CAPITULATION` | `4h-12h` |
| `DEAD` | `none` |

## Invalidation Examples

- `"Lose 24h structural support at $X — breakdown invalidates long thesis."`
- `"4h ADX collapse below 18 — trend exhaustion, switch to range tactics."`
- `"Liquidity drops below $200k — execution risk too high, exit regardless of price."`
- `"Base-eco regime flips to BEAR_TREND — cohort drag overrides single-token signal."`

Invalidations are always concrete (price levels, indicator thresholds, regime states) — never vague (`"if it feels wrong"`).
