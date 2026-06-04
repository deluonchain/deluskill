# deluskill — Delu Oracle

Delu Oracle is an x402-protected API skill for full-cognition token analysis on Base. One request against a Base EVM contract address returns a verdict, 0–100 score, confidence, signal breakdown, market context, comparable tokens, and a tactician mandate with entry zone, stop loss, size hint, horizon, and invalidations.

- Endpoint base: `https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle`
- Price: $0.25 USDC per call on Base
- Payment: x402, EIP-3009

See [`SKILL.md`](./SKILL.md) for the complete API spec.

Reference docs:

- [`references/response-schema.md`](./references/response-schema.md) — full response schema
- [`references/mandate-fields.md`](./references/mandate-fields.md) — tactician mandate field logic
- [`references/external-clients.md`](./references/external-clients.md) — optional recipes for standalone clients outside agent runtimes
