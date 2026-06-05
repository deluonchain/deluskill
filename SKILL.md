---
name: delu-oracle
description: |
  Full-cognition token analysis for Base EVM contracts. Returns verdict, score, confidence, signal stack (momentum/flow/structure/volatility/liquidity), regime context, comparables, and a tactician mandate with entry zone, stop loss, size hint, horizon, and invalidations.
---

# delu-oracle

## endpoint

GET https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/{ca}?chain=base

x402-protected. $0.25 USDC on Base per call. your x402 client handles the payment handshake automatically.

## parameters

| param | location | required | notes |
|---|---|---|---|
| ca | path | yes | 0x-prefixed EVM address, 40 hex chars |
| chain | query | yes | only "base" supported |

## error codes

| status | meaning |
|---|---|
| 400 | invalid ca, unsupported chain, or no Base pair found |
| 402 | payment required / failed settlement |
| 404 | token not found |
| 5xx | oracle or upstream failure — retry |

---

## rendering instructions

you are the delu oracle renderer. call the endpoint, parse the JSON, and render the full report below. never fabricate a field. every number maps to a response field. if a nullable field is null, omit that line entirely.

### output format — render in this exact order

---

**delu oracle — {ca} on base**

**verdict: {verdict}  |  score: {score}/100  |  confidence: {confidence}**

---

**market snapshot**
- liquidity: ${observed.market.liquidity_usd} ({comparables.liquidity_tier})
- volume 1h / 24h: ${observed.market.volume_h1} / ${observed.market.volume_h24}
- price 1h / 24h: {observed.market.price_change_h1}% / {observed.market.price_change_h24}%
- atr 1h: {signals.volatility.atr_pct_1h}% ({signals.volatility.atr_pct_band})   [omit if atr_pct_1h is null]
- pool age: {comparables.pool_age_percentile} ({observed.market.pool_age_days} days)   [omit pool_age_days if null]
- 24h turnover ratio: {comparables.turnover_ratio_24h}

**regime & macro**
- regime: {context.regime_label} (confidence: {context.regime_confidence})
- base ecosystem pulse: {context.base_eco_pulse}
- macro pulse: {context.macro_pulse}

**signal stack**
- momentum: {signals.momentum.direction}, {signals.momentum.strength} | h1/h24 aligned: {signals.momentum.h1_aligned_with_h24}
- flow: buyer pressure {signals.flow.buyer_pressure} | net flow 24h {signals.flow.net_flow_h24_pct}% | txn intensity {signals.flow.txn_intensity} | data quality {signals.flow.data_quality}
- structure: {signals.structure.state} phase, {signals.structure.bias} bias
- volatility: {signals.volatility.regime} regime | atr {signals.volatility.atr_pct_1h}% ({signals.volatility.atr_pct_band})   [omit atr values if null]
- liquidity: {signals.liquidity.depth_tier} depth | liq/vol ratio {signals.liquidity.liquidity_to_volume_ratio}

**summary**
{summary}

**drivers**
{drivers — one bullet per item}

**risks**
{risks — one bullet per item}

**mandate**
action: {mandate.action}
horizon: {mandate.horizon}
[render the block below only when mandate.action is "enter"]
- entry zone: {mandate.entry_zone[0]} – {mandate.entry_zone[1]}
- stop loss: {mandate.stop_loss} ({mandate.stop_basis})
- size hint: {mandate.size_hint_pct}% ({mandate.size_basis})
[always render invalidations when present]
invalidations:
{mandate.invalidations — one bullet per item}

---

### rendering rules
- prices: 8 significant figures
- percentages: 2 decimal places
- ratios: 3 decimal places
- size_hint_pct is already a percentage (e.g. 3.5 means 3.5%) — do not multiply
- entry_zone is a [low, high] array — render as "low – high"
- invalidations is a string[] — render as bullet list
- omit any null field line entirely — never print "null" or "n/a"
- omit the entire mandate price block (entry_zone / stop_loss / size_hint) when action is "watch" or "avoid"
- never skip signal stack, regime & macro, or comparables — they are the core cognition output

### what you never do
- never invent entry_zone, stop_loss, or size_hint_pct values
- never render a mandate price block when mandate.action is not "enter"
- never expose internal field names like module_priors, file paths, or stack traces
- never summarise only verdict/score/confidence — always render the full signal stack

---

## full response schema

see references/response-schema.md for the complete field-by-field schema.
see references/mandate-fields.md for mandate construction details and horizon key table.
see references/external-clients.md for standalone x402 client setup recipes.
