# Social Enrichment — Opt-In Two-Step Flow

Pass `?social=true` to enable checkr social signal enrichment. Adds +$0.45 USDC billed to the caller. Without it, `observed.social` reads `{ "status": "unavailable" }`.

## ⚠️ Explicit opt-in required

Social enrichment is a **paid optional feature** (+$0.45 USDC per call). It must never be enabled silently or by default. The agent must obtain explicit user confirmation before passing `?social=true`, including disclosure of the additional cost.

## Step 1 — Fetch checkr signal for the CA

```
GET https://api.checkr.social/v1/token/{ca}
```

Use `call_x402_endpoint` (or equivalent) with the CA directly — no symbol lookup needed.

## Step 2 — POST to oracle with checkr_meta body

```json
{
  "social_score": <ais normalized to 0-1>,
  "checkr_meta": {
    "sentiment_score": <ais>,
    "momentum": <velocity>,
    "mention_velocity": <velocity>,
    "influencer_hits": <Math.round(cascade_multiplier)>
  }
}
```

## Field mapping

| checkr field | oracle POST field |
|---|---|
| `ais` | `sentiment_score` + `social_score` (already 0–1) |
| `velocity` | `momentum` + `mention_velocity` |
| `cascade_multiplier` | `influencer_hits` (round to int) |

The oracle blends `social_score` into the fused score at 15% weight (25% when no quant prior is present).

## Fallback — disclose failure, do not silently swallow it

If the checkr fetch fails for any reason, **do not silently fall back** to a plain GET. The user paid for social enrichment and must be told it failed.

The agent must:
1. Inform the user that social enrichment failed (surface the error reason if available)
2. Ask whether to proceed with a quant-only result or abort
3. Only fall back to a plain GET if the user explicitly confirms

A quant-only result must never be presented as a fully enriched result. If the response was fetched without social data, label it clearly: "social enrichment unavailable — quant-only result."
