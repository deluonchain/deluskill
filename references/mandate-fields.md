# delu-oracle — Tactician Mandate Fields

The `mandate` block is the analytical output: where the oracle sees entry, where it places the stop, how much it suggests sizing, and over what horizon. It is regenerated on every call and reflects current price, ATR, regime, and confidence.

**The mandate is analysis — not an execution instruction.** Any swap, trade, approval, transfer, or position change based on mandate fields requires explicit user confirmation, including token, amount, slippage, chain, and max loss, before execution.

## Fields

| Field | Type | Description |
|---|---|---|
| `entry_zone` | [number, number] | Lower/upper bound for entry. ATR-based — typically current price ± 0.25 × ATR. |
| `stop_loss` | number | Hard invalidation price. ATR-multiplied stop below entry mid. Multiplier scales with verdict conviction. |
| `size_hint_pct` | number | Suggested position size as % of portfolio. Kelly-lite formula tilted by regime and confidence. Clamped to `[0.5, 10.0]`. A suggestion only — confirm with user before applying. |
| `horizon` | string | Time-to-target window. Regime-keyed (see table below). |
| `invalidations` | string[] | English-form conditions that void the mandate (structure break, regime flip, etc.). Never includes liquidity thresholds. |

## Sizing Formula

Kelly-lite sizing:

```
winRate = 0.52 + 0.08 * confidence
rr = 1.5 + regime_rr_bonus
kelly = winRate - (1 - winRate) / rr
size_hint_pct = clamp(kelly * 0.25 * 100 * confidence, 0.5, 10.0)
```

Where `regime_rr_bonus` ∈ `{BULL_TREND: 0.5, BULL_CHOP: 0.25, BASE_DECOUPLED: 0.3, MIXED: 0.0, BEAR_TREND: -0.3, BEAR_CAPITULATION: -0.2, DEAD: -999}`.

A `DEAD` regime always returns `size_hint_pct: 0` and `horizon: "none"` — the mandate is informational only.

## Stop Loss Logic

1. Primary: `entry_mid - atrMult × ATR` where `ATR` comes from 1h OHLCV candles.
2. `atrMult` scales with verdict: `strong_buy → 0.5`, `buy → 0.75`, `hold/avoid/drop → 1.0`.
3. Fallback: if ATR data is unavailable, use `entry_mid * 0.93` (7% stop floor).

## Horizon Keys

| Regime | Horizon |
|---|---|
| `BULL_TREND` | `4h-12h` |
| `BULL_CHOP` | `1h-4h` |
| `BASE_DECOUPLED` | `2h-6h` |
| `MIXED` | `30m-2h` |
| `BEAR_TREND` | `15m-1h` |
| `BEAR_CAPITULATION` | `15m-30m` |
| `DEAD` | `none` |

## Invalidation Examples

- `"Close below $X — structural support lost, long thesis void."`
- `"Regime flip away from BULL_TREND — cohort drag overrides single-token signal."`
- `"Structure confirms markdown continuation — distribution phase extends."`

Invalidations are always concrete (price levels, regime states, structure conditions) — never vague (`"if it feels wrong"`). Liquidity thresholds are not used as invalidations — liquidity can increase on a 50% drawdown due to volume, making it a misleading signal.
