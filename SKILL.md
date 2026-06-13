---
name: delu-oracle
version: 11
description: Full-cognition token analysis for Base EVM tokens via the deluagent oracle. Tiered pricing (100M+ free, 50M+ 50k DELU, Public 500k DELU). Returns a flat decision header plus verdict, score, signals, and mandate. Single CA, GET, upto scheme.
---

# delu-oracle

Delu Oracle is the intelligence layer for any Base trading agent. Pass one Base EVM contract address and get back a flat `decision` header an agent can act on in a single hop — `action`, `conviction`, entry/stop/size, and a one-line delu-voiced `read` — with the full cognition report (verdict, score, signals, regime context, tactician mandate) underneath for the why.

Scout, auditor, and quant are computed server-side on every call — no enrichment POST body required. Social signal (checkr) is opt-in via `?social=true`.

> **v27-tiered-flywheel.** The endpoint now uses the `upto` scheme with real-time balance-based discounting. Agents sign for the 500k DELU maximum, but the handler settles for 50k (holders) or 0 (whales) based on their $DELU balance on Base.

## Endpoint

```
GET https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/{ca}
```

Base is the only supported chain — no chain parameter needed.

## Parameters

| Parameter | Location | Required | Notes |
|---|---|---|---|
| `ca` | path | yes | 0x-prefixed EVM contract address (40 hex chars) |
| `social` | query | no | Pass `?social=true` to enable checkr social enrichment (+$0.45 USDC, billed to caller) |
| `verbose` | query | no | Pass `?verbose=true` to include the raw `observed` block + scout/auditor/quant mirror + pre-lint `summary`. Off by default. |

## The decision header — read this first

The fastest path for a consuming agent. Flat, no traversal:

```json
"decision": {
  "action": "ENTER",          // ENTER | WATCH | AVOID
  "conviction": 71,            // 0-100, round(score × confidence)
  "direction": "long",
  "entry_low": 0.00051,
  "entry_high": 0.00053,
  "stop": 0.00048,
  "size_pct": 3.1,
  "read": "one line, delu voice"
}
```

A simple gate: `decision.action === "ENTER" && decision.conviction >= 70 && confidence >= 0.6`. Everything below `decision` is the supporting evidence.

`action` maps from `verdict`: strong_buy/buy → `ENTER`, hold → `WATCH`, avoid/drop → `AVOID`. `read` is the narrative run through delu voice guardrails — lowercase, no cashtags, no contract addresses, no dashes.

## Pool selection & OHLCV ladder

- **Canonical pool** is chosen by `liquidity × (0.25 + min(volume_h24 / liquidity, 5))` — the pool actually trading, not the fattest dead pool. Pancakeswap pairs excluded. `pool_source` reports `primary` or `gecko_alt_pool` if a fallback re-resolution was used.
- **OHLCV ladder**: 1h (needs ≥14 candles + finite ATR) → 15m → 5m. If the primary pool yields no usable ladder, the oracle re-resolves the canonical pool and retries. `selected_timeframe` and `candle_count` report what the read was built on. Fresh pools (<~15h old) now return a real entry/stop/size instead of nulls.

## Live priors

Quant regime weights and the volatility penalty are loaded per request from the deluagent learning store (`module_priors.json`), shallow-merged over `DEFAULT_PRIORS`. The oracle's verdict reflects accumulated win-rate learning, not factory defaults — and matches what a full deluagent-cycle would produce on the same token.

## Social enrichment — opt-in two-step flow

By default, social is omitted (and `observed.social` reads `{ "status": "unavailable" }` only under `?verbose=true`).

When `?social=true` is passed, the skill executes a two-step flow:

**Step 1 — fetch checkr signal for the CA:**

```
GET https://api.checkr.social/v1/token/{ca}
```

Use the `call_x402_endpoint` tool (or equivalent) with the CA directly — no symbol lookup needed.

**Step 2 — POST to oracle with checkr_meta body:**

```json
{
  "social_score": <ais normalized to 0-1>,
  "checkr_meta": {
    "sentiment_score": <ais>,
    "momentum": <velocity>,
    "mention_velocity": <velocity>,
    "influencer_hits": <Math.round(cascade_multiplier)>
  }
}
```

Field mapping:

| checkr field | oracle field |
|---|---|
| `ais` | `sentiment_score` + `social_score` (already 0-1) |
| `velocity` | `momentum` + `mention_velocity` |
| `cascade_multiplier` | `influencer_hits` (round to int) |

The oracle blends `social_score` into the fused score at 15% weight (or 25% when no quant prior is present).

**Fallback:** if the checkr fetch fails for any reason, silently fall back to a plain GET (quant-only, no social). Do not halt or surface the error to the user.

## POST body (optional enrichment)

All fields are optional. When provided, they override the server-side computed values.

```json
{
  "social_score": 0.72,
  "checkr_meta": { "sentiment_score": 0.68, "momentum": 1.2, "mention_velocity": 4.1, "influencer_hits": 3 },
  "scout":   { "viabilityScore": 85, "smartMoney": true, "capitalInflowRatio": 0.12, "buyPressure": 0.61, "bucket": "tier1" },
  "auditor": { "verdict": "SAFE", "safetyScore": 91, "hardFail": false },
  "quant":   { "finalQuantScore": 0.38 }
}
```

## Quant scoring — regime-adaptive weights

The quant score uses regime-adaptive weights from live priors (falling back to `DEFAULT_PRIORS`). In a bull regime momentum is weighted higher; in a bear regime inflow dominates and momentum is penalised. Under `?verbose=true` the `weights_used` field in `observed.deluagent.quant` exposes what fired.

| Regime | Momentum | Volume | Inflow | Structure |
|---|---|---|---|---|
| `BULL_TREND` | 0.55 | 0.25 | 0.20 | 0.25 (fixed) |
| `BULL_CHOP` | 0.40 | 0.30 | 0.30 | 0.25 (fixed) |
| `MIXED` | 0.35 | 0.30 | 0.35 | 0.25 (fixed) |
| `BEAR_TREND` | 0.20 | 0.30 | 0.50 | 0.25 (fixed) |
| `BEAR_CAPITULATION` | 0.25 | 0.35 | 0.40 | 0.25 (fixed) |
| `BASE_DECOUPLED` | 0.45 | 0.30 | 0.25 | 0.25 (fixed) |

Structure weight is always 0.25; the remaining 0.75 is split across momentum/volume/inflow per the table. The momentum/volume/inflow row is re-normalised before scaling, so any learned-prior weights still sum correctly.

## WATCH mandate — null position fields

When `verdict` is `hold`, `decision.action` and `mandate.action` are `WATCH`. No position is being entered, so all position-specific fields are `null` in both blocks:

- `entry_low` / `entry_high` / `stop` / `size_pct` (decision) and `entry_zone` / `stop_loss` / `stop_basis` / `size_hint_pct` / `size_basis` (mandate)

Only `horizon` and `invalidations` are populated for WATCH — conditions to monitor, not a trade to execute.

## Response schema summary

Returns JSON with:

- `decision`: flat header — `action`, `conviction`, `direction`, `entry_low`, `entry_high`, `stop`, `size_pct`, `read`
- `ca`, `chain`, `oracle_version`
- `verdict`: `strong_buy` | `buy` | `hold` | `avoid` | `drop`
- `score`: 0–100 fused cognition score
- `confidence`: 0–1 data quality and signal agreement score
- `drivers` / `risks`: up to 3 each — top bullish factors / risks
- `signals`: momentum, flow, structure, volatility, liquidity
- `signals.flow.net_flow_h1_pct`: h1-derived net flow percentage (buyer pressure ratio from h1 txn data)
- `context`: regime_label, regime_confidence, base_eco_pulse, macro_pulse
- `mandate`: action, entry_zone, stop_loss, stop_basis, size_hint_pct, size_basis, horizon, invalidations
- `selected_timeframe`, `candle_count`, `pool_source`: data provenance
- `timestamp`

**`?verbose=true` adds:** `observed.market` (price, liquidity, volume, ATR, pool age, dex), `observed.regime`, `observed.social`, `observed.deluagent` (scout/auditor/quant mirror), and the pre-lint `summary`.

See [`references/response-schema.md`](./references/response-schema.md) for the full field-by-field schema and [`references/mandate-fields.md`](./references/mandate-fields.md) for mandate construction details.

## Error codes

| Status | Meaning |
|---|---|
| `400` | Bad `ca` value, malformed address, or no supported Base pair found |
| `402` | Payment required, missing payment, invalid payment, or failed settlement |
| `404` | Unknown token or no reportable token data found |
| `5xx` | Oracle or upstream service failure — retry later |

## Pricing (Hold-to-Discount Flywheel)

The endpoint uses the `upto` scheme with real-time balance-based discounting. Agents sign for the 500,000 DELU maximum, but the handler settles for a lower amount based on the caller's $DELU balance on Base.

| Tier | Holding | Cost per call |
|---|---|---|
| **Whale** | 100M+ DELU | **0 DELU (Free)** |
| **Holder** | 50M+ DELU | **50,000 DELU** |
| **Public** | < 50M DELU | **500,000 DELU** |

**Payment token:** DELU — `0x7b0ee9dcb5c1d4d7cd630c652959951936512ba3` on Base (18 decimals).

## Payment

This endpoint is x402-protected with ERC-20 token payment. Your agent's x402 client receives a `402` with payment requirements specifying 500,000 DELU on Base, signs the appropriate authorization, retries with `X-PAYMENT`, and receives the response plus an `X-PAYMENT-RESPONSE` settlement receipt. Any x402 client that supports ERC-20 token payments (Bankr, Claude + x402 MCP, x402-fetch, x402 Python SDK) implements this handshake automatically.

## Example response (default, no verbose)

```json
{
  "decision": {
    "action": "WATCH",
    "conviction": 25,
    "direction": "long",
    "entry_low": null,
    "entry_high": null,
    "stop": null,
    "size_pct": null,
    "read": "bnkr scores 46, hold, in a mixed regime at low conviction. price action is mixed, up on the hour but down on the day, a short term bounce against a broader downtrend. structure sits in markdown with a bearish bias, volatility is normal at 2.32% atr. no clean entry yet, wait for structure to resolve."
  },
  "ca": "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b",
  "chain": "base",
  "score": 46,
  "verdict": "hold",
  "confidence": 0.55,
  "drivers": [
    "premium liquidity ($2.33M) — deep execution headroom",
    "high turnover (vol24h $163k against liquidity)"
  ],
  "risks": [
    "structure in markdown, downside continuation risk",
    "hourly and daily momentum diverge"
  ],
  "signals": {
    "momentum":   { "h1_aligned_with_h24": false, "direction": "bullish", "strength": "weak" },
    "flow":       { "buyer_pressure": "balanced", "net_flow_h1_pct": -33.4, "txn_intensity": "high", "data_quality": "full" },
    "structure":  { "state": "markdown", "bias": "bearish" },
    "volatility": { "regime": "normal", "atr_pct_1h": 2.32, "atr_pct_band": "p25-p50" },
    "liquidity":  { "depth_tier": "premium", "liquidity_to_volume_ratio": 14.31 }
  },
  "context": {
    "regime_label": "MIXED",
    "regime_confidence": 0.11,
    "base_eco_pulse": "flat",
    "macro_pulse": "neutral"
  },
  "mandate": {
    "action": "WATCH",
    "entry_zone": null,
    "stop_loss": null,
    "stop_basis": null,
    "size_hint_pct": null,
    "size_basis": null,
    "horizon": "30m-2h",
    "invalidations": [
      "regime flip away from MIXED",
      "structure confirms markdown continuation"
    ]
  },
  "selected_timeframe": "1h",
  "pool_source": "primary",
  "candle_count": 168,
  "timestamp": "2026-06-09T00:00:00.000Z",
  "oracle_version": "v27-tiered-flywheel"
}
```

Pass `?verbose=true` to additionally receive `observed` (market/regime/social + scout/auditor/quant mirror) and the pre-lint `summary`.

## External client recipes

Optional standalone-client recipes live in [`references/external-clients.md`](./references/external-clients.md).
