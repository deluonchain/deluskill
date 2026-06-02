# Integration

## Endpoint

```
GET https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/{ca}?chain=base
```

- price: **0.25 USDC** on Base (paid via x402)
- method: `GET`
- only `chain=base` is supported in v2

## Using the npm client

```ts
import { analyzeToken } from "@deluonchain/deluskill";

const result = await analyzeToken({
  ca: "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b",
  chain: "base",
  fetchFn: yourX402Fetch, // any fetch that handles x402 402 Payment Required
});

if (result.verdict === "strong_buy" || result.verdict === "buy") {
  if (result.mandate.action === "enter" && result.mandate.entry_zone) {
    placeEntry(result.mandate.entry_zone, result.mandate.stop_loss, result.mandate.size_hint_pct);
  }
}
```

## Calling without the client (raw fetch)

```ts
const url = "https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/0x22af33fe49fd1fa80c7149773dde5890d3c76f3b?chain=base";
const res = await x402Fetch(url, { method: "GET" });
const data = await res.json(); // OracleResponse, see schema/oracle-response.schema.json
```

The first call returns `402 Payment Required` with x402 payment instructions; pay 0.25 USDC on Base and retry with the payment proof header.

## Error responses

| status | shape                                | meaning                                                   |
|--------|--------------------------------------|-----------------------------------------------------------|
| 400    | `{ "error": "..." }`                 | invalid CA, unsupported chain, or no supported Base pair  |
| 402    | x402 payment required                | retry after paying 0.25 USDC                              |
| 405    | `{ "error": "method not allowed" }`  | use GET                                                   |
| 502    | `{ "error": "oracle request failed" }` | upstream cognition failure                              |

## Verdict semantics

- **strong_buy** — high score, regime supportive, structure bullish, flow dominant. Mandate typically `enter` with full size hint.
- **buy** — favorable but not at conviction peak. Mandate `enter` with smaller size hint.
- **hold** — mixed signals, no edge. Mandate usually `watch`.
- **avoid** — actively negative drivers outweigh positives. Mandate `avoid`.
- **drop** — multiple structural risks. Mandate `avoid`, often with explicit invalidation.

## Mandate fields

Always present (`mandate` is never null in v2). When `action = "watch"` or `"avoid"`, fields like `entry_zone`, `stop_loss`, `size_hint_pct`, `stop_basis`, `size_basis` can be `null`.

- `entry_zone` — `{ low, high }` USD price band where the mandate considers entry valid
- `stop_loss` — USD price; basis is given in `stop_basis` (e.g. ATR multiplier, structure level)
- `size_hint_pct` — suggested portfolio weight (0-100); basis in `size_basis` (e.g. kelly fraction, volatility-targeted)
- `horizon` — expected holding window (e.g. `"intraday"`, `"swing-multiday"`)
- `invalidation` — what must happen for the mandate to be cancelled

## JSON schema

Full machine-readable schema at [`schema/oracle-response.schema.json`](../schema/oracle-response.schema.json).
