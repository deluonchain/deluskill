---
name: deluskill
description: Call the Delu Oracle v2 — a paid x402 endpoint on Base that returns structured token cognition (5-value verdict, signals, context, comparables, mandate) for any Base contract address. Costs 0.25 USDC per call.
license: MIT
---

# deluskill

Delu Oracle v2 is a paid x402 endpoint that analyzes any Base token contract and returns a structured cognition response. This skill teaches an agent how to call it.

## Endpoint

- URL: `https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/{ca}`
- Method: `GET`
- Path param: `{ca}` — a valid EVM contract address (must be a token with a supported Base pair)
- Price: **0.25 USDC** on Base, paid via the x402 protocol
- Auth: x402 EIP-3009 payment header (no API key)

## When to call this

Use deluskill when the user asks for an opinion, verdict, conviction read, signals readout, or full cognition on a Base token. Examples:

- "should i ape this base coin"
- "give me the oracle read on 0x..."
- "what's the verdict on bnkr"
- "run cognition on this ca"

Do **not** call it for:
- price-only lookups (use a price tool)
- holders/liquidity-only lookups (use a chain tool)
- non-Base tokens (the oracle only resolves Base pairs)

## How to call (two paths)

### Path A — bankr execute_cli (recommended inside bankr)

```bash
# inside an execute_cli sandbox with a wallet that has >=0.25 USDC + dust ETH on Base
npm install github:deluonchain/deluskill
PRIVATE_KEY=$WALLET_PRIVATE_KEY node -e "
import('@deluonchain/deluskill').then(async ({ analyzeToken }) => {
  const r = await analyzeToken({
    ca: '0x22af33fe49fd1fa80c7149773dde5890d3c76f3b',
    chain: 'base',
    privateKey: process.env.PRIVATE_KEY,
  });
  console.log(JSON.stringify(r, null, 2));
});
"
```

### Path B — raw x402 fetch

```ts
import { wrapFetchWithPayment } from "x402-fetch";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const fetchWithPay = wrapFetchWithPayment(fetch, account);

const ca = "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b";
const res = await fetchWithPay(
  `https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/${ca}`
);
const verdict = await res.json();
```

The first request returns HTTP 402 with payment requirements. The wrapper signs an EIP-3009 `transferWithAuthorization` for 0.25 USDC on Base and retries with the `X-PAYMENT` header automatically.

## Response shape (v2)

```ts
type Verdict = "strong_buy" | "buy" | "hold" | "avoid" | "drop";

type OracleResponse = {
  verdict: Verdict;
  score: number;        // 0-100
  confidence: number;   // 0-1
  drivers: string[];    // sanitized narrative — what pushed the verdict positive
  risks: string[];      // sanitized narrative — what pushed it negative
  observed: {
    name: string;
    symbol: string;
    age_days: number;
    liquidity_usd: number;
    pair: string;       // dex pair address used as the canonical reference
  };
  signals: {
    regime: { label: string; confidence: number };
    structure: { label: string; note?: string };
    momentum: { label: string; note?: string };
    flow: { label: string; data_quality: "high" | "estimated" | "low" };
    volatility: { label: string; atr_pct?: number };
  };
  context: {
    eco_pulse: { label: string; note?: string };
    macro: { label: string; note?: string };
  };
  comparables: Array<{ symbol: string; similarity: number; note?: string }>;
  mandate: {
    action: "enter" | "watch" | "avoid";
    entry_zone?: [number, number];
    stop_loss?: number;
    size_hint_pct?: number;
    invalidations?: string[];
  };
};
```

## Verdicts cheat sheet

| verdict       | score   | mandate.action | meaning |
|---------------|---------|----------------|---------|
| `strong_buy`  | 80-100  | enter          | high conviction, all major signals aligned |
| `buy`         | 60-79   | enter          | favorable, ≥3 of 4 major signal groups bullish |
| `hold`        | 40-59   | watch          | mixed, wait for invalidation to flip |
| `avoid`       | 20-39   | avoid          | active negatives outweigh positives |
| `drop`        | 0-19    | avoid          | multiple structural risks / thin liquidity |

## Errors

- `400 "valid EVM contract address required"` — `ca` is malformed
- `400 "no supported Base pair found"` — token has no readable Base liquidity
- `402` — payment failed / insufficient USDC on Base / wrong signature
- `502 "oracle request failed"` — internal failure, retry

## Cost notes

Each call is 0.25 USDC on Base. Plan for one call per analysis. Cache results client-side if the same `ca` is queried repeatedly within a short window — the cognition output is stable across minutes, not seconds.

## Reference

- Repo: https://github.com/deluonchain/deluskill
- Full JSON schema: `schema/oracle-response.schema.json` in this repo
- TypeScript types: `src/types.ts`
- x402 protocol: https://x402.org
