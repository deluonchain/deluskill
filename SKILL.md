---
name: delu-oracle
description: |
  Full-cognition token analysis for any Base EVM contract via the Delu Oracle x402 API.
  Use when you need a deep verdict on a Base token — momentum, money flow, structure,
  volatility, liquidity, regime context, comparable tokens, and a tactician mandate
  (entry zone, stop loss, position size, time horizon, invalidations).
  Triggers: "analyze TOKEN on Base", "delu oracle on 0x...", "deep cognition for X",
  "should I buy this Base token", "full analysis of 0x...", any Base token research
  needing fused multi-signal cognition with an actionable mandate.
  Payments via x402 — USDC on Base, no API key or account needed.
---

# delu-oracle

Full-cognition token analysis for Base chain tokens. One call returns a verdict, a 0–100 score, confidence, signal breakdown, market context, comparables, and a tactician mandate.

**Base URL:** `https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle`
**Payment:** x402 — USDC on Base mainnet, pay-per-call, no account needed.

## Endpoints

| Endpoint | Price | What it returns |
|---|---|---|
| `GET /analyze/{ca}?chain=base` | $0.25 | Full cognition: verdict, score 0–100, confidence, signals, context, comparables, mandate |

`{ca}` must be a 0x-prefixed 40-hex EVM contract address on Base.

## How to Call (x402)

x402 is pay-per-call. No API key or account. Wallet + USDC on Base is all you need.

**TypeScript (x402-fetch):**
```ts
import { wrapFetchWithPayment } from "x402-fetch";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const fetchWithPay = wrapFetchWithPayment(fetch, account);

const ca = "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b"; // BNKR
const res = await fetchWithPay(
  `https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/${ca}?chain=base`
);
const result = await res.json();

console.log(result.verdict, result.score, result.confidence);
console.log(result.mandate.entry_zone, result.mandate.stop_loss);
```

**Python (x402):**
```python
from x402.client import x402_client

client = x402_client(wallet=YOUR_WALLET)

ca = "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b"  # BNKR
url = f"https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/{ca}?chain=base"
result = client.get(url).json()

print(result["verdict"], result["score"], result["confidence"])
print(result["mandate"]["entry_zone"], result["mandate"]["stop_loss"])
```

Payment is handled automatically by the x402 client — it intercepts the 402, signs an EIP-3009 `transferWithAuthorization` for 0.25 USDC on Base, and retries with the `X-PAYMENT` header.

## Response Shape

```json
{
  "version": "v2-full-cognition",
  "ca": "0x...",
  "chain": "base",
  "symbol": "BNKR",
  "verdict": "buy",
  "score": 71,
  "confidence": 0.72,
  "signals": {
    "momentum": { "...": "..." },
    "flow": { "data_quality": "full", "...": "..." },
    "structure": { "...": "..." },
    "volatility": { "band": "normal", "...": "..." },
    "liquidity": { "tier": "deep", "...": "..." }
  },
  "context": {
    "regime": "BULL_TREND",
    "base_eco_pulse": "...",
    "macro": "..."
  },
  "comparables": [{ "symbol": "...", "...": "..." }],
  "mandate": {
    "entry_zone": [0.0234, 0.0241],
    "stop_loss": 0.0219,
    "size_hint_pct": 2.4,
    "horizon": "4h-24h",
    "invalidations": ["..."]
  },
  "summary": "...",
  "drivers": ["..."],
  "risks": ["..."]
}
```

## Verdict Thresholds

| Score | Verdict |
|---|---|
| 78–100 | `strong_buy` |
| 62–77 | `buy` |
| 42–61 | `hold` |
| 25–41 | `avoid` |
| 0–24 | `drop` |

Confidence is a separate 0–1 value reflecting data quality and signal agreement — a `buy` at confidence 0.4 is much weaker than a `buy` at 0.8.

## Practical Flow

```python
# 1. Got a Base token CA from somewhere — research it.
ca = "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b"
url = f"https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/{ca}?chain=base"
result = client.get(url).json()

# 2. Read the verdict and confidence together.
if result["verdict"] in ("strong_buy", "buy") and result["confidence"] >= 0.6:
    mandate = result["mandate"]
    # entry_zone, stop_loss, size_hint_pct, horizon all ready to act on
```

See `references/response-schema.md` for the full field-by-field response schema and `references/mandate-fields.md` for how the tactician mandate is constructed.

## Errors

- `400 "valid EVM contract address required"` — `ca` is malformed
- `400 "no supported Base pair found"` — token has no readable Base liquidity
- `402` — payment required / insufficient USDC on Base / wrong signature
- `502 "oracle request failed"` — internal failure, retry

## Requirements

- USDC on Base mainnet (≥ $0.25 per call plus gas)
- Python: `pip install x402`
- TypeScript: `npm install x402-fetch viem`
- Base gas for payment (~$0.01)
