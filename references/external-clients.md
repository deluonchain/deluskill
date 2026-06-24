# External client recipes

> For developers writing a client outside an agent runtime (standalone scripts, custom servers). Agents inside Bankr, Claude, OpenAI, LangChain, or any runtime with built-in x402 support do NOT need any of this — their runtime handles payment.

These examples are optional recipes for standalone callers. The API spec lives in [`../SKILL.md`](../SKILL.md).

Endpoint used below:

`GET https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/{ca}`

Base is the only supported chain — no chain parameter needed. The endpoint uses x402 with Permit2 (`upto` scheme) and settles in DELU on Base. Cost depends on your DELU tier — see `SKILL.md` for the tier table. The response leads with a flat `decision` block — read that first; the full cognition report sits underneath.

## ⚠️ Wallet custody warning

These examples load a private key directly to sign x402 payments. Before using any of them:

- **Use a dedicated low-balance hot wallet.** Never use a primary wallet or one that holds unrelated funds.
- **Set a spending limit.** Fund the wallet with only what you expect to spend across your planned calls.
- **Never commit `.env` files.** Add `.env` to `.gitignore` before writing any secrets to it.
- **Verify package integrity.** Install only the pinned versions listed below. Review changelogs before upgrading — these packages sign wallet payments.

## TypeScript: viem + x402-fetch

```bash
npm install x402-fetch@0.4.0 viem@2.21.19
```

```ts
import { wrapFetchWithPayment } from "x402-fetch";
import { privateKeyToAccount } from "viem/accounts";

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) throw new Error("PRIVATE_KEY is required for this standalone example");

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

// surface signal for user review — confirm before any trade execution
if (d.action === "ENTER" && d.conviction >= 70 && report.confidence >= 0.6) {
  console.log("signal: entry", d.entry_low, d.entry_high, "stop", d.stop, "size%", d.size_pct);
}
```

## Python: x402 SDK

```bash
pip install x402==0.3.1
```

```python
import os
from x402.client import x402_client

private_key = os.environ.get("PRIVATE_KEY")
if not private_key:
    raise RuntimeError("PRIVATE_KEY is required for this standalone example")

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

# surface signal for user review — confirm before any trade execution
if d["action"] == "ENTER" and d["conviction"] >= 70 and report["confidence"] >= 0.6:
    print("signal: entry", d["entry_low"], d["entry_high"], "stop", d["stop"], "size%", d["size_pct"])
```

## Raw HTTP: manual x402 payment flow

Use this only when you are implementing your own x402 client. Most callers should use an existing x402 client instead of manually building payment headers.

High-level flow:

1. Send the request without `X-PAYMENT`.
2. Read the `402 Payment Required` response body.
3. Select the accepted requirement for Base DELU (Permit2 `upto` scheme).
4. Build a Permit2 authorization for the required amount.
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

Pass `?social=true` for checkr social enrichment (+$0.45 USDC). Requires explicit user opt-in — see `references/social-enrichment.md`.

Do not put standalone wallet-loading snippets in `SKILL.md`. Keep them here so agent runtimes can consume the skill as a pure API spec while standalone developers still have reference material.
