# External client recipes

> For developers writing a client outside an agent runtime (standalone scripts, custom servers). Agents inside Bankr, Claude, OpenAI, LangChain, or any runtime with built-in x402 support do NOT need any of this — their runtime handles payment.

These examples are optional recipes for standalone callers. The API spec lives in [`../SKILL.md`](../SKILL.md).

Endpoint used below:

`GET https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/{ca}`

Base is the only supported chain — no chain parameter needed. Payment is settled in DELU on Base via the x402 `upto` scheme with Permit2. The response leads with a flat `decision` block — read that first; the full cognition report sits underneath.

## ⚠️ Wallet custody warning — read before running any example

These examples load a private key directly to sign x402 payments. Before using any of them:

- **Use a dedicated low-balance hot wallet.** Never use a primary wallet or any wallet holding unrelated funds, NFTs, or significant assets.
- **Set a spending limit.** Fund the wallet with only the DELU and ETH (for gas) needed for your session. Top up as needed — do not pre-load large balances.
- **Never commit `.env` files.** Add `.env` to `.gitignore` before writing any key to disk. Use a secrets manager (Doppler, AWS Secrets Manager, 1Password CLI) in production.
- **Rotate keys regularly.** Treat any key that has touched a script as potentially exposed. Rotate after each session if possible.
- **Never use these examples in a browser or client-side context.** Private keys in browser environments are trivially extractable.

## TypeScript: viem + x402-fetch

```bash
npm install x402-fetch@0.4.2 viem@2.21.54
```

```ts
import { wrapFetchWithPayment } from "x402-fetch";
import { privateKeyToAccount } from "viem/accounts";

// Use a dedicated low-balance hot wallet — see custody warning above.
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) throw new Error("PRIVATE_KEY is required — use a dedicated hot wallet, never a primary wallet");

const account = privateKeyToAccount(privateKey as `0x${string}`);
const fetchWithPayment = wrapFetchWithPayment(fetch, account);

const ca = "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b";
const url = `https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/${ca}`;

const response = await fetchWithPayment(url);
if (!response.ok) {
  throw new Error(`Request failed: ${response.status} ${await response.text()}`);
}

const report = await response.json();

// read the decision header first — analysis only, not an execution instruction
const d = report.decision;
console.log(d.action, d.conviction, d.read);
console.log("settled:", report.payment_tier.settled_delu, "DELU");

// filter candidates for human review — do not auto-execute
if (d.action === "ENTER" && d.conviction >= 70 && report.confidence >= 0.6) {
  console.log("candidate — confirm with user before any trade");
  console.log("entry", d.entry_low, d.entry_high, "stop", d.stop, "size%", d.size_pct);
}
```

## Python: x402 SDK

```bash
pip install x402==0.3.1
```

```python
import os
from x402.client import x402_client

# Use a dedicated low-balance hot wallet — see custody warning above.
private_key = os.environ.get("PRIVATE_KEY")
if not private_key:
    raise RuntimeError("PRIVATE_KEY is required — use a dedicated hot wallet, never a primary wallet")

# Construct the SDK wallet/account using your x402 SDK version's wallet helper.
# Some environments pass a wallet object; others configure signing through provider middleware.
client = x402_client(wallet=private_key)

ca = "0x22af33fe49fd1fa80c7149773dde5890d3c76f3b"
url = f"https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/{ca}"

response = client.get(url)
response.raise_for_status()
report = response.json()

d = report["decision"]
print(d["action"], d["conviction"], d["read"])
print("settled:", report["payment_tier"]["settled_delu"], "DELU")

# filter candidates for human review — do not auto-execute
if d["action"] == "ENTER" and d["conviction"] >= 70 and report["confidence"] >= 0.6:
    print("candidate — confirm with user before any trade")
    print("entry", d["entry_low"], d["entry_high"], "stop", d["stop"], "size%", d["size_pct"])
```

## Raw HTTP: manual x402 payment flow

Use this only when you are implementing your own x402 client. Most callers should use an existing x402 client instead of manually building payment headers.

Payment uses the `upto` scheme with Permit2 (ERC-20 DELU on Base). The endpoint settles based on the caller's DELU balance — see the tier table in `SKILL.md`.

High-level flow:

1. Send the request without `X-PAYMENT`.
2. Read the `402 Payment Required` response body.
3. Select the accepted requirement for Base DELU (`upto` scheme).
4. Build a Permit2 authorization for the required amount (up to 250,000 DELU).
5. Sign the authorization with the paying wallet.
6. Encode the x402 payment payload.
7. Retry the original request with `X-PAYMENT: <encoded-payment-payload>`.
8. Read the JSON response (start with the `decision` block) and the `X-PAYMENT-RESPONSE` settlement receipt.

```bash
# 1. Discover payment requirements.
curl -i \
  "https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/0x22af33fe49fd1fa80c7149773dde5890d3c76f3b"

# 2. Your custom client signs the Permit2 authorization and encodes the x402 payload.
PAYMENT="<encoded-x402-payment-payload>"

# 3. Retry with payment.
curl -i \
  -H "X-PAYMENT: ${PAYMENT}" \
  "https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/0x22af33fe49fd1fa80c7149773dde5890d3c76f3b"
```

Note: `?verbose=true` is accepted but is a no-op — `observed` and `summary` are always present in the default response. Pass `?social=true` for checkr social enrichment (+$0.45 USDC, requires explicit user opt-in).

Do not put standalone wallet-loading snippets in `SKILL.md`. Keep them here so agent runtimes can consume the skill as a pure API spec while standalone developers still have reference material.
