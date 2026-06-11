# delu-oracle — Response Schema

Locked JSON shape returned by `GET /analyze/{ca}?chain=base`. Fields are stable across the `v23-decision-first` version. Any breaking change bumps the `oracle_version` string.

> **v23 change:** the response now leads with a flat `decision` block so a consuming agent can read the call in one hop. `comparables` is removed (single-CA focus). The scout/auditor/quant mirror and the raw `observed` block are now behind `?verbose=true`. One CA per call, `GET`, $0.25 — unchanged.

## `decision` (read this first)

The flat decision header. Everything an executor needs, no traversal.

| Field | Type | Description |
|---|---|---|
| `action` | enum | `ENTER`, `WATCH`, or `AVOID`. Mapped from `verdict` (strong_buy/buy → ENTER, hold → WATCH, avoid/drop → AVOID). |
| `conviction` | number | 0–100. `round(score × confidence)` — a single number to threshold on. |
| `direction` | enum | `long`. The oracle is long-only on Base spot. |
| `entry_low` | number \| null | Lower entry bound (mirrors `mandate.entry_zone[0]`). |
| `entry_high` | number \| null | Upper entry bound (mirrors `mandate.entry_zone[1]`). |
| `stop` | number \| null | Hard invalidation price (mirrors `mandate.stop_loss`). |
| `size_pct` | number \| null | Suggested size as % of portfolio (mirrors `mandate.size_hint_pct`). |
| `read` | string | One-line delu-voiced signal. lowercase, no cashtags, no contract addresses, no dashes. |

A simple agent gate: `decision.action === "ENTER" && decision.conviction >= 70 && confidence >= 0.6`.

## Top-level

| Field | Type | Description |
|---|---|---|
| `decision` | object | Flat decision header — see above. |
| `oracle_version` | string | `"v23-decision-first"` for this API. |
| `ca` | string | The 0x-prefixed EVM contract address echoed back. |
| `chain` | string | Always `"base"`. |
| `verdict` | enum | One of `strong_buy`, `buy`, `hold`, `avoid`, `drop`. |
| `score` | number | 0–100. Fused quant + structure + flow + regime tilt. |
| `confidence` | number | 0–1. Reflects data quality and inter-signal agreement. |
| `signals` | object | Per-dimension breakdown — see below. |
| `context` | object | Regime + macro + base-eco pulse. |
| `mandate` | object | Tactician trade plan — see `mandate-fields.md`. |
| `drivers` | string[] | Up to 3 bullet-form positives. |
| `risks` | string[] | Up to 3 bullet-form risks. |
| `selected_timeframe` | enum \| null | OHLCV timeframe the read was built on: `1h`, `15m`, `5m`, or `null` if no usable candles. |
| `candle_count` | number | Number of candles in the selected timeframe. |
| `pool_source` | enum | `primary` (canonical pool) or `gecko_alt_pool` (alt-pool fallback used). |
| `timestamp` | string | ISO-8601. |

## `signals.momentum`

`h1_aligned_with_h24` (bool), `direction` (`bullish`/`bearish`/`neutral`), `strength` (`strong`/`moderate`/`weak`).

## `signals.flow`

Money flow from dexscreener trade data: `buyer_pressure` (`dominant`/`balanced`/`weak`/`unknown`), `net_flow_h1_pct`, `txn_intensity` (`high`/`normal`/`low`), and `data_quality` (`full` when both buys and sells are present, `estimated` when only one side is reported).

## `signals.structure`

Detected chart structure from the selected-timeframe OHLCV ladder: `state` (`accumulation`, `markup`, `distribution`, `markdown`, `mixed`) and `bias` (`bullish`/`bearish`/`neutral`).

## `signals.volatility`

`regime` (`low`/`normal`/`elevated`/`extreme`), `atr_pct_1h` (ATR as % of price, computed on the selected timeframe; `null` if unavailable), `atr_pct_band` (`p0-p25`/`p25-p50`/`p50-p75`/`p75-p100`).

## `signals.liquidity`

`depth_tier` (`thin`/`moderate`/`deep`/`premium`), `liquidity_to_volume_ratio`.

## `context`

| Field | Type | Description |
|---|---|---|
| `regime_label` | enum | One of `BASE_DECOUPLED`, `BULL_TREND`, `BULL_CHOP`, `MIXED`, `BEAR_TREND`, `BEAR_CAPITULATION`, `DEAD`. |
| `regime_confidence` | number | 0–1. |
| `base_eco_pulse` | enum | `expanding`, `contracting`, or `flat`. Pulse of base-eco anchors (BNKR, AERO, VIRTUAL, VVV, LFI). |
| `macro_pulse` | enum | `supportive`, `neutral`, or `headwind`. cbBTC/WETH macro anchors. |

## `?verbose=true` (debug only)

When `verbose=true` is passed, two extra keys are added:

- `observed` — raw market block (`market`, `regime`, `social`) plus the `deluagent` mirror (`scout`, `auditor`, `quant`).
- `summary` — the pre-lint narrative (the source of `decision.read` before voice guardrails).

These are omitted by default to keep the payload lean (~50-60% smaller). Do not depend on them in production clients.

## Pool selection & OHLCV ladder (v23)

- **Canonical pool** is chosen by `liquidity × (0.25 + min(volume_h24 / liquidity, 5))` — the pool actually trading, not the fattest dead pool. Pancakeswap pairs are excluded.
- **OHLCV ladder**: tries `1h` (needs ≥14 candles + finite ATR), falls back to `15m`, then `5m`. If the primary pool yields no usable ladder, the oracle re-resolves the canonical pool and retries (`pool_source: "gecko_alt_pool"`). Fresh pools (<~15h) now return a real mandate instead of nulls.

For mandate fields (`entry_zone`, `stop_loss`, `size_hint_pct`, `horizon`, `invalidations`) see `mandate-fields.md`.
