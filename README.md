# deluskill — Delu Oracle

A bankr skill that gives any agent access to full-cognition token analysis for Base chain tokens via the `delu-oracle` x402 API.

**Endpoint:** `https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle`
**Price:** $0.25 USDC per call on Base mainnet
**Payment:** x402 — pay-per-call, no API key, no account.

See [`SKILL.md`](./SKILL.md) for the full skill definition and call examples. See [`references/`](./references) for response schema and mandate field reference.

## What it does

One call against a Base EVM contract address returns:

- a verdict (`strong_buy` / `buy` / `hold` / `avoid` / `drop`)
- a 0–100 score and 0–1 confidence
- per-dimension signals (momentum, flow, structure, volatility, liquidity)
- market context (regime, base-eco pulse, macro)
- up to 5 comparable base-eco tokens
- a tactician mandate (entry zone, stop loss, size hint, horizon, invalidations)
- english summary, drivers, risks

## Install

Any bankr-compatible agent that supports skill installation can install this skill by repo URL:

```
https://github.com/deluonchain/deluskill
```

