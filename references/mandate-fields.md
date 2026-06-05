# mandate fields reference

the `mandate` block is the tactician output layer. it is present when `verdict` is `buy` or `strong_buy`, and null otherwise (the `action` field will be `watch` or `avoid` with no price levels).

## field definitions

### action
`"enter" | "watch" | "avoid"`
- `enter` — verdict is buy/strong_buy, entry levels are populated
- `watch` — verdict is hold, no entry levels
- `avoid` — verdict is avoid/drop, no entry levels

### entry_zone
`[number, number] | null`
array of `[low, high]` — ATR-based entry price band (±0.5 ATR around current price).
null when action is not `enter`.

### stop_loss
`number | null`
hard stop price level. computed as `entry_zone[0] - 2 × ATR_1h`.
fallback: `current_price × 0.93` when ATR is unavailable (stop_basis will be `"fallback_7pct"`).
null when action is not `enter`.

### stop_basis
`string | null`
`"atr_2x_h1"` — stop derived from 2× 1h ATR below entry low
`"fallback_7pct"` — ATR unavailable, flat 7% floor used
null when action is not `enter`.

### size_hint_pct
`number | null`
kelly-quarter position size as a **percentage of portfolio** (e.g. `3.5` means 3.5%).
clamped to `[0.5, 10.0]`.
regime-tilted: bull regimes get full tilt (1.0×), bear regimes get 0.5×, chop gets 0.75×.
null when action is not `enter`.

### size_basis
`string | null`
always `"kelly_quarter_regime_adjusted"` when present.
null when action is not `enter`.

### horizon
`string`
regime-keyed holding window. always present regardless of action.

| regime label        | horizon     |
|---------------------|-------------|
| BULL_TREND          | 4h-24h      |
| BULL_CHOP           | 1h-4h       |
| BASE_DECOUPLED      | 2h-12h      |
| MIXED               | 2h-8h       |
| BEAR_TREND          | 1h-3h       |
| BEAR_CHOP           | 30m-2h      |
| BEAR_CAPITULATION   | 15m-1h      |
| DEAD                | none        |

### invalidations
`string[]`
array of concrete conditions that invalidate the mandate. always present, may be empty array.
when action is `enter`, contains price-level conditions:
- `"close below {stop_loss}"`
- `"regime flip away from {regime_label}"`
- `"liquidity drops below $50k"`

when action is `watch` or `avoid`, contains qualitative conditions:
- `"wait for cleaner structure or regime confirmation before sizing in"`
- or `"do not enter under current conditions"`

## rendering rules
- render `entry_zone` as `{entry_zone[0]} – {entry_zone[1]}` (dash-separated price range)
- render `size_hint_pct` as `{value}%` — it is already a percentage, do not multiply
- render `invalidations` as a bullet list
- omit any null field entirely — do not print "null" or "n/a"
- omit the entire mandate price block when action is `watch` or `avoid`
