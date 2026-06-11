# External client recipes

> For developers writing a client outside an agent runtime (standalone scripts, custom servers). Agents inside Bankr, Claude, OpenAI, LangChain, or any runtime with built-in x402 support do NOT need any of this — their runtime handles payment.

These examples are optional recipes for standalone callers. The API spec lives in [`../SKILL.md`](../SKILL.md).

Endpoint used below:

`GET https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/{ca}`

Base is the only supported chain — no chain parameter needed. The endpoint costs $0.25 USDC on Base per call and uses x402 with EIP-3009. The response leads with a flat `decision` block — read that first; the full cognition report sits underneath.

## TypeScript: viem + x402-fetch

Use this only in a standalone process where you are responsible for wallet custody.

```bash
npm install x402-fetch viem
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

// read the decision header first — one hop to the call
const d = report.decision;
console.log(d.action, d.conviction, d.read);

// simple agent gate
if (d.action === "ENTER" && d.conviction >= 70 && report.confidence >= 0.6) {
  console.log("entry", d.entry_low, d.entry_high, "stop", d.stop, "size%", d.size_pct);
}
```

## Python: x402 SDK

Use this only in a standalone process where you are responsible for wallet custody. Adapt wallet construction to your wallet provider or SDK version.

```bash
pip install x402
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

if d["action"] == "ENTER" and d["conviction"] >= 70 and report["confidence"] >= 0.6:
    print("entry", d["entry_low"], d["entry_high"], "stop", d["stop"], "size%", d["size_pct"])
```

## Raw HTTP: manual x402 payment flow

Use this only when you are implementing your own x402 client. Most callers should use an existing x402 client instead of manually building payment headers.

High-level flow:

1. Send the request without `X-PAYMENT`.
2. Read the `402 Payment Required` response body.
3. Select the accepted requirement for Base USDC.
4. Build an EIP-3009 `transferWithAuthorization` authorization for the required amount.
5. Sign the authorization with the paying wallet.
6. Encode the x402 payment payload.
7. Retry the original request with `X-PAYMENT: <encoded-payment-payload>`.
8. Read the JSON response (start with the `decision` block) and the `X-PAYMENT-RESPONSE` settlement receipt.

```bash
# 1. Discover payment requirements.
curl -i \
  "https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/0x22af33fe49fd1fa80c7149773dde5890d3c76f3b"

# 2. Your custom client signs the EIP-3009 authorization and encodes the x402 payload.
PAYMENT="<encoded-x402-payment-payload>"

# 3. Retry with payment.
curl -i \
  -H "X-PAYMENT: ${PAYMENT}" \
  "https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle/analyze/0x22af33fe49fd1fa80c7149773dde5890d3c76f3b"
```

Pass `?verbose=true` for the raw `observed` block (market/regime/social + scout/auditor/quant mirror). Pass `?social=true` for checkr social enrichment (+$0.45).

Do not put standalone wallet-loading snippets in `SKILL.md`. Keep them here so agent runtimes can consume the skill as a pure API spec while standalone developers still have reference material.
