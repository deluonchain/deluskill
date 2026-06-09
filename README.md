# deluskill — Delu Oracle

> Full-cognition token analysis for Base. One call returns a verdict, 0–100 score, signal breakdown, market context, and a tactician mandate — powered by the deluagent cognition stack.

## Install

```
bankr install https://github.com/deluonchain/deluskill
```

## What you get

- **Verdict** — `strong_buy` | `buy` | `hold` | `avoid` | `drop`
- **Score** — 0–100 fused cognition score (quant + scout + auditor + optional social)
- **Confidence** — 0–1 signal agreement score
- **Narrative** — rich human-readable paragraph covering regime, price action, structure, volume, flow, ATR, macro, safety, and mandate
- **Signals** — momentum, flow, structure, volatility, liquidity
- **Mandate** — entry zone, stop loss, size hint (Kelly-lite), horizon, invalidations
- **Comparables** — pool age band, liquidity tier, turnover ratio

## Endpoint

```
GET https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/{ca}
```

- **Chain:** Base only
- **Price:** $0.25 USDC per call (x402, EIP-3009)
- **Social enrichment:** pass `?social=true` to add checkr sentiment (+$0.45, billed to caller)

## Docs

| File | Contents |
|---|---|
| [`SKILL.md`](./SKILL.md) | Full API spec — parameters, social flow, response schema, error codes, example |
| [`references/response-schema.md`](./references/response-schema.md) | Field-by-field response schema |
| [`references/mandate-fields.md`](./references/mandate-fields.md) | Tactician mandate field logic |
| [`references/external-clients.md`](./references/external-clients.md) | TypeScript, Python, and raw HTTP recipes for standalone clients |

## Payment

x402-protected. Any x402 client (Bankr, Claude + x402 MCP, `x402-fetch`, x402 Python SDK) handles the payment handshake automatically — no manual signing required.
