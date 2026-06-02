# delu-oracle — Response Schema

Locked JSON shape returned by `GET /analyze/{ca}?chain=base`. Fields are stable across the `v2-full-cognition` version. Any breaking change bumps the `version` string.

## Top-level

| Field | Type | Description |
|---|---|---|
| `version` | string | Always `"v2-full-cognition"` for this API. |
| `ca` | string | The 0x-prefixed EVM contract address echoed back. |
| `chain` | string | Always `"base"` for v2. |
| `symbol` | string | Token symbol from on-chain metadata / dexscreener. |
| `verdict` | enum | One of `strong_buy`, `buy`, `hold`, `avoid`, `drop`. |
| `score` | number | 0–100. Fused quant + structure + flow + regime tilt. |
| `confidence` | number | 0–1. Reflects data quality and inter-signal agreement. |
| `signals` | object | Per-dimension breakdown — see below. |
| `context` | object | Regime + macro + base-eco pulse. |
| `comparables` | array | Up to 5 base-eco tokens used as comp anchors. |
| `mandate` | object | Tactician trade plan — see `mandate-fields.md`. |
| `summary` | string | 1–2 sentence english summary. |
| `drivers` | string[] | Up to 7 bullet-form positives. |
| `risks` | string[] | Up to 7 bullet-form risks. |

## `signals.momentum`

Multi-timeframe price momentum. `score_0_100`, `tf_1h_pct`, `tf_4h_pct`, `tf_24h_pct`, plus a `regime_tilt` value that biases score by current market regime.

## `signals.flow`

Money flow from dexscreener trade data: `buy_vol_usd`, `sell_vol_usd`, `ratio`, `score_0_100`, and `data_quality` (`full` when both buys and sells are present, `estimated` when only one side is reported).

## `signals.structure`

Detected chart structure from 1h/4h OHLCV: `pattern` (`uptrend`, `downtrend`, `breakout`, `breakdown`, `consolidation`, `chop`), `support_levels`, `resistance_levels`, `score_0_100`.

## `signals.volatility`

`atr_pct` (ATR as % of price), `band` (`compressed`, `normal`, `expanded`, `extreme`), `score_0_100`, and a `penalty_applied` flag for the high-vol haircut.

## `signals.liquidity`

`liquidity_usd`, `tier` (`thin`, `moderate`, `deep`), `pair_address`, `dex`, `pool_age_days`, `score_0_100`.

## `context`

| Field | Type | Description |
|---|---|---|
| `regime` | enum | One of `BASE_DECOUPLED`, `BULL_TREND`, `BULL_CHOP`, `MIXED`, `BEAR_TREND`, `BEAR_CAPITULATION`, `DEAD`. |
| `base_eco_pulse` | string | English summary of base-eco anchors (BNKR, AERO, VIRTUAL, VVV, LFI). |
| `macro` | string | English summary of cbBTC/WETH macro anchors. |

## `comparables`

Array of up to 5 base-eco anchor tokens with their own current verdict and key metrics. Used to contextualise the target token against the cohort.

For mandate fields (`entry_zone`, `stop_loss`, `size_hint_pct`, `horizon`, `invalidations`) see `mandate-fields.md`.
