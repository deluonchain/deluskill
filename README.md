# delu oracle (v2)

full-cognition token oracle for Base. one HTTP call, structured response: 0-100 score, 5-value verdict, signals, context, comparables, and a tactician mandate.

- **endpoint:** `https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle`
- **price:** 0.25 USDC on Base (x402)
- **method:** `GET /analyze/{ca}?chain=base`
- **version:** `v2-full-cognition`

## what you get

```json
{
  "ca": "0x...",
  "chain": "base",
  "score": 0,
  "verdict": "strong_buy | buy | hold | avoid | drop",
  "confidence": 0.0,
  "summary": "...",
  "drivers": ["..."],
  "risks": ["..."],
  "observed": { "market": { }, "regime": { }, "social": { } },
  "signals": {
    "momentum":   { "h1_aligned_with_h24": false, "direction": "...", "strength": "..." },
    "flow":       { "buyer_pressure": "...", "net_flow_h24_pct": 0, "txn_intensity": "...", "data_quality": "..." },
    "structure":  { "state": "...", "bias": "..." },
    "volatility": { "regime": "...", "atr_pct_1h": 0, "atr_pct_band": "..." },
    "liquidity":  { "depth_tier": "...", "liquidity_to_volume_ratio": 0 }
  },
  "context":     { "regime_label": "...", "regime_confidence": 0, "base_eco_pulse": "...", "macro_pulse": "..." },
  "comparables": { "pool_age_percentile": "...", "liquidity_tier": "...", "turnover_ratio_24h": 0 },
  "mandate":     { "action": "...", "entry_zone": { "low": 0, "high": 0 }, "stop_loss": 0, "stop_basis": "...", "size_hint_pct": 0, "size_basis": "...", "horizon": "...", "invalidation": "..." },
  "timestamp": "...",
  "oracle_version": "v2-full-cognition"
}
```

## install

```bash
npm install @deluonchain/deluskill
```

## quickstart

```ts
import { analyzeToken } from "@deluonchain/deluskill";

const result = await analyzeToken({
  ca: "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b",
  chain: "base",
  x402Wallet: yourX402PaymentSigner,
});

console.log(result.verdict, result.score, result.mandate);
```

see `docs/` for full integration walkthrough, schema reference, and verdict semantics.

## what's new in v2

- 5-value verdict (`strong_buy | buy | hold | avoid | drop`) replaces the 3-value v1 verdict
- structured `signals` object (momentum, flow, structure, volatility, liquidity) instead of unstructured fields
- new `context` object with regime label, base eco pulse, macro pulse
- new `comparables` object (pool age tier, liquidity tier, turnover ratio)
- new `mandate` object with tactical entry zone, stop loss, size hint, horizon, invalidation
- price: 0.10 USDC → 0.25 USDC reflecting the upgraded cognition stack
- regime-adaptive scoring with real ATR, multi-timeframe structure detection, and pnl-bias fusion

## license

MIT
