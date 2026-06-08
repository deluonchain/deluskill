---
name: delu-oracle
description: |
  Pure API spec for the Delu Oracle x402 endpoint. Use it when an agent needs a full-cognition report for a Base EVM token contract: verdict, score, confidence, signal breakdown, context, comparables, and tactician mandate fields.
---

# delu-oracle

Delu Oracle returns a full-cognition token analysis report for a Base EVM contract address: verdict, 0–100 score, confidence, signal breakdown, market context, comparable tokens, and a tactician mandate with entry zone, stop loss, size hint, horizon, and invalidations.

## Endpoint

`GET https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze?ca={ca}`

Base is the only supported chain — no chain parameter needed.

## Parameters

| Parameter | Location | Required | Validation |
|---|---:|---:|---|
| `ca` | query | yes | Must be a 0x-prefixed EVM contract address: `0x` followed by 40 hex characters. |

## Response schema summary

Returns JSON with:

- `oracle_version`, `ca`, `chain`, `symbol`
- `verdict`: one of `strong_buy`, `buy`, `hold`, `avoid`, `drop`
- `score`: 0–100 fused cognition score
- `confidence`: 0–1 data quality and signal agreement score
- `signals`: momentum, flow, structure, volatility, liquidity
- `context`: regime, Base ecosystem pulse, macro context
- `observed`: raw signal inputs including social and deluagent cognition blocks
- `comparables`: comparable Base ecosystem tokens
- `mandate`: entry zone `[low, high]`, stop loss, size hint (% of portfolio), horizon, invalidations `string[]`
- `summary`, `drivers`, `risks`

See [`references/response-schema.md`](./references/response-schema.md) for the full field-by-field schema and [`references/mandate-fields.md`](./references/mandate-fields.md) for mandate construction details.

## Error codes

| Status | Meaning |
|---:|---|
| `400` | Bad `ca` value, malformed address, or no supported Base pair found. |
| `402` | Payment required, missing payment, invalid payment, insufficient USDC, or failed settlement. |
| `404` | Unknown token or no reportable token data found. |
| `5xx` | Oracle or upstream service failure. Retry later. |

## Pricing

$0.25 USDC on Base per call (x402, EIP-3009).

## Payment

This endpoint is x402-protected. Your agent's x402 client will receive a `402` with payment requirements, sign an EIP-3009 `transferWithAuthorization` for 0.25 USDC on Base, retry with `X-PAYMENT`, and receive the response plus an `X-PAYMENT-RESPONSE` settlement receipt. You do not need to implement that handshake — every x402 client (Bankr, Claude + x402 MCP, x402-fetch, the x402 Python SDK, etc.) implements it.

## HTTP flow example

```bash
# 1. First request returns 402 with payment requirements.
curl -i \
  "https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze?ca=0x22af33fe49fd1fa80c7149773dde5890d3c76f3b"

# 2. Your x402 client signs the EIP-3009 authorization.
PAYMENT="<x402-client-generated-payment-payload>"

# 3. Retry with X-PAYMENT.
curl -i \
  -H "X-PAYMENT: ${PAYMENT}" \
  "https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze?ca=0x22af33fe49fd1fa80c7149773dde5890d3c76f3b"

# HTTP/2 200
# {
#   "oracle_version": "v2-full-cognition",
#   "ca": "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b",
#   "chain": "base",
#   "symbol": "BNKR",
#   "verdict": "strong_buy",
#   "score": 77,
#   "confidence": 0.62,
#   "signals": {
#     "momentum": "bullish",
#     "flow": "neutral",
#     "structure": "markdown",
#     "volatility": "low",
#     "liquidity": "deep"
#   },
#   "context": {
#     "regime": "BULL_CHOP",
#     "regime_confidence": 0.62,
#     "base_eco_pulse": "bearish",
#     "macro_pulse": "risk-off"
#   },
#   "observed": {
#     "social": { "sentiment": 0.30, "momentum": 0, "mentions_per_hour": 0 },
#     "deluagent": {
#       "scout": { "viabilityScore": 78, "smartMoney": false, "bucket": "tier1" },
#       "auditor": { "verdict": "SAFE", "safetyScore": 93, "hardFail": false },
#       "quant": { "quantScore": 32, "regime": "TRENDING_DOWN", "RSI": 32 }
#     }
#   },
#   "comparables": [],
#   "mandate": {
#     "action": "ENTER",
#     "entry_zone": [0.000491, 0.000537],
#     "stop_loss": 0.000470,
#     "size_hint_pct": 4.87,
#     "horizon": "1h-4h",
#     "invalidations": [
#       "close below entry",
#       "regime flip away from BULL_CHOP",
#       "liquidity drops below $50k"
#     ]
#   },
#   "summary": "BNKR scores 77/100 in a bull chop regime with moderate confidence.",
#   "drivers": ["liquidity at $2.26M", "vol24h at $544k"],
#   "risks": ["h24 price change -14.79%", "structure in markdown phase"]
# }
```

## External client recipes

Agents running inside a runtime with x402 support do not need client setup code in this spec. Optional standalone-client recipes live in [`references/external-clients.md`](./references/external-clients.md).
