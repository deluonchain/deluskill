# deluskill — Delu Oracle

> The intelligence layer for any Base trading agent. One call on a Base contract address returns a flat decision header — action, conviction, entry, stop, size, and a one-line read — with the full cognition report (verdict, score, signals, regime context, tactician mandate) underneath. Powered by the deluagent cognition stack.

## Install

```
bankr install https://github.com/deluonchain/deluskill
```

## What you get

- **Decision header** — `action` (ENTER/WATCH/AVOID), `conviction` (0–100), `direction`, `entry_low`/`entry_high`, `stop`, `size_pct`, and a one-line delu-voiced `read`. Act in one hop, no traversal.
- **Verdict** — `strong_buy` | `buy` | `hold` | `avoid` | `drop`
- **Score** — 0–100 fused cognition score (quant + scout + auditor + optional social)
- **Confidence** — 0–1 signal agreement score
- **Signals** — momentum, flow, structure, volatility, liquidity
- **Context** — regime label/confidence, base-eco pulse, macro pulse
- **Mandate** — entry zone, stop loss, size hint (Kelly-lite), horizon, invalidations
- **Provenance** — `selected_timeframe`, `candle_count`, `pool_source` so you know what the read was built on

Single CA in, that one token analysed — no cross-token comparables. Pool selection is volume-weighted and the OHLCV read uses a 1h→15m→5m ladder, so even fresh pools return a real mandate.

## Endpoint

```
GET https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/{ca}
```

- **Chain:** Base only
- **Pricing (Hold-to-Discount Flywheel):** The endpoint uses the `upto` scheme with real-time balance-based discounting. Agents sign for the 250,000 DELU maximum, but the handler settles for a lower amount based on the caller's $DELU balance on Base.

| Tier | Holding | Cost per call |
|---|---|---|
| **Whale** | 100M+ DELU | **0 DELU (Free)** |
| **Holder** | 50M+ DELU | **50,000 DELU** |
| **Public** | < 50M DELU | **250,000 DELU** |

- **Token:** `0x7b0ee9dcb5c1d4d7cd630c652959951936512ba3` (DELU on Base)
- **Social enrichment:** pass `?social=true` to add checkr sentiment (+$0.45 USDC, billed to caller)
- **Verbose:** pass `?verbose=true` for the raw `observed` block + scout/auditor/quant mirror (off by default)

## Docs

| File | Contents |
|---|---|
| [`SKILL.md`](./SKILL.md) | Full API spec — parameters, decision header, social flow, response schema, error codes, example |
| [`references/response-schema.md`](./references/response-schema.md) | Field-by-field response schema |
| [`references/mandate-fields.md`](./references/mandate-fields.md) | Tactician mandate field logic |
| [`references/external-clients.md`](./references/external-clients.md) | TypeScript, Python, and raw HTTP recipes for standalone clients |

## Payment

x402-protected. Payment is settled in DELU (`0x7b0ee9dcb5c1d4d7cd630c652959951936512ba3`) on Base. Any x402 client that supports ERC-20 token payments (Bankr, Claude + x402 MCP, `x402-fetch`, x402 Python SDK) handles the payment handshake automatically — no manual signing required. Callers need a DELU balance on Base (or USDC/ETH for atomic swap-to-pay).
