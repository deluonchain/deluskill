# delu-oracle

Delu Oracle returns a full-cognition token analysis report for a Base EVM contract address: a rich narrative summary, verdict, 0–100 score, confidence, signal breakdown, market context, comparable tokens, and a tactician mandate with entry zone, stop loss, size hint, horizon, and invalidations.

Scout, auditor, and quant are computed server-side on every call — no enrichment POST body required. Social signal (checkr) is opt-in via `?social=true` or via POST body.

## Endpoint

`GET https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle`

Base is the only supported chain — no chain parameter needed.

## Parameters

| Parameter | Location | Required | Notes |
|---|---|---|---|
| `ca` | query | yes | 0x-prefixed EVM contract address (40 hex chars) |
| `social` | query | no | Pass `?social=true` to enable checkr social enrichment (+$0.45, billed to caller) |

## Social enrichment — opt-in

By default, `observed.social` returns `{ "status": "unavailable" }`.

To enable social signal, either:

**Option A — query param (caller handles checkr):**
Pass `?social=true` — the caller is expected to POST `checkr_meta` in the request body (see POST body below).

**Option B — POST body:**
POST `{ "checkr_meta": { ... }, "social_score": 0.72 }` directly. The oracle folds it into `observed.social` and the `deluBlend` fusion score.

`checkr_meta` fields used by the oracle:
- `sentiment_score` — 0–1 normalized sentiment
- `momentum` — mention momentum
- `mention_velocity` — mentions per hour
- `influencer_hits` — influencer signal count

`social_score` — raw 0–1 float, used directly in `deluBlend` when `checkr_meta` is absent.

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

## Response schema summary

Returns JSON with:

- `ca`, `chain`, `oracle_version`
- `verdict`: `strong_buy` | `buy` | `hold` | `avoid` | `drop`
- `score`: 0–100 fused cognition score
- `confidence`: 0–1 data quality and signal agreement score
- `narrative`: rich human-readable paragraph — verdict, regime, price action, structure, volume, flow, ATR, macro, safety, mandate close
- `drivers`: string array — top bullish factors
- `risks`: string array — top bearish factors / risks
- `observed.market`: price, liquidity, volume, ATR, pool age, dex
- `observed.regime`: label, confidence
- `observed.social`: checkr enrichment when available, else `{ "status": "unavailable" }`
- `observed.deluagent`: scout, auditor, quant — always populated server-side
- `signals`: momentum, flow, structure, volatility, liquidity
- `context`: regime_label, regime_confidence, base_eco_pulse, macro_pulse
- `comparables`: pool_age_band, liquidity_tier, turnover_ratio
- `mandate`: action, entry_zone `[low, high]`, stop_loss, stop_basis, size_hint_pct, size_basis, horizon, invalidations `string[]`

See [`references/response-schema.md`](./references/response-schema.md) for the full field-by-field schema and [`references/mandate-fields.md`](./references/mandate-fields.md) for mandate construction details.

## Error codes

| Status | Meaning |
|---|---|
| `400` | Bad `ca` value, malformed address, or no supported Base pair found |
| `402` | Payment required, missing payment, invalid payment, or failed settlement |
| `404` | Unknown token or no reportable token data found |
| `5xx` | Oracle or upstream service failure — retry later |

## Pricing

$0.25 USDC on Base per call (x402, EIP-3009).

## Payment

This endpoint is x402-protected. Your agent's x402 client receives a `402` with payment requirements, signs an EIP-3009 `transferWithAuthorization` for 0.25 USDC on Base, retries with `X-PAYMENT`, and receives the response plus an `X-PAYMENT-RESPONSE` settlement receipt. Every x402 client (Bankr, Claude + x402 MCP, x402-fetch, x402 Python SDK) implements this handshake automatically.

## Example response

```json
{
  "ca": "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b",
  "chain": "base",
  "score": 46,
  "verdict": "hold",
  "confidence": 0.55,
  "narrative": "BNKR scores 46/100 — hold — in a mixed regime (low conviction, 0.11). Price action is mixed: +0.80% on the hour but -4.55% on the day — short-term bounce against a broader downtrend. Structure is in markdown — price is below prior range lows, sellers in control. Volume is $163k over 24h against $2.33M liquidity (turnover 7.0%). Flow is balanced — high transaction intensity. ATR(14) at 2.32% — normal volatility. Base ecosystem flat, macro is neutral. Safety check: SAFE — no hard fails, liquidity and volume thresholds met. Social signal: unavailable on this call — pass checkr_meta in POST body for sentiment enrichment. Mandate: WATCH. No clean entry yet — wait for structure to resolve. Signal confidence: moderate (0.55) — partial data, treat sizing conservatively.",
  "drivers": [
    "liquidity at $2.33M — deep enough for clean execution",
    "vol24h at $163k — strong participation"
  ],
  "risks": [
    "structure in markdown phase — downtrend continuation risk",
    "h1 momentum diverges from h24 trend — directional uncertainty"
  ],
  "observed": {
    "market": {
      "symbol": "BNKR",
      "price_usd": 0.0005252,
      "liquidity_usd": 2329813.59,
      "volume_h1": 1588.2,
      "volume_h24": 162806.17,
      "price_change_h1": 0.8,
      "price_change_h6": -0.37,
      "price_change_h24": -4.55,
      "atr_pct_1h": 2.32,
      "pool_age_days": 552.8,
      "dex_id": "uniswap",
      "raw_ohlcv_used": true
    },
    "regime": { "label": "MIXED", "confidence": 0.11 },
    "social": { "status": "unavailable", "note": "pass checkr_meta or social_score in POST body to enable" },
    "deluagent": {
      "scout":   { "viabilityScore": 90, "smartMoney": false, "capitalInflowRatio": 0.0699, "buyPressure": 0.4673, "bucket": "tier1", "source": "internal" },
      "auditor": { "verdict": "SAFE", "safetyScore": 100, "hardFail": false, "hardFails": [], "source": "internal" },
      "quant":   { "quantScore": 46.4, "regime": "MIXED", "structure_phase": "markdown", "atr_pct_1h": 2.32, "source": "internal" }
    }
  },
  "signals": {
    "momentum":   { "direction": "bullish", "strength": "weak", "h1_aligned_with_h24": false },
    "flow":       { "buyer_pressure": "balanced", "net_flow_h24_pct": -33.4, "txn_intensity": "high", "data_quality": "estimated" },
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
  "comparables": {
    "pool_age_band": "veteran (>180d)",
    "liquidity_tier": "premium",
    "turnover_ratio": 0.0699
  },
  "mandate": {
    "action": "WATCH",
    "entry_zone": [0.0005191, 0.00052886],
    "stop_loss": 0.000513,
    "stop_basis": "1x ATR (2.32% of price)",
    "size_hint_pct": 4.58,
    "size_basis": "kelly-lite: regime=MIXED, confidence=0.55",
    "horizon": "30m-2h",
    "invalidations": [
      "close below 0.000513",
      "regime flip away from MIXED",
      "liquidity drops below $50k",
      "structure confirms markdown continuation"
    ]
  },
  "timestamp": "2026-06-08T23:14:54.823Z",
  "oracle_version": "v2-full-cognition"
}
```

## External client recipes

Optional standalone-client recipes live in [`references/external-clients.md`](./references/external-clients.md).
