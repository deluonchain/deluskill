// delu oracle v2 — public entry
//
// thin client over the delu oracle x402 endpoint. it does NOT bundle x402 payment
// handling — pass your own fetch wrapper (or use the helper in x402/) when calling
// from a payment-capable runtime.

import type { AnalyzeTokenInput, OracleResponse } from "./types";
import { DELU_ORACLE_ENDPOINT } from "./types";

export * from "./types";

export interface AnalyzeTokenOptions extends AnalyzeTokenInput {
  /**
   * Fetch function to use. Defaults to globalThis.fetch.
   * Pass an x402-capable fetch when calling the paid endpoint.
   */
  fetchFn?: typeof fetch;
}

const EVM_CA = /^0x[a-fA-F0-9]{40}$/;

export async function analyzeToken(opts: AnalyzeTokenOptions): Promise<OracleResponse> {
  const { ca, chain = "base", endpointUrl = DELU_ORACLE_ENDPOINT } = opts;
  const fetchFn = opts.fetchFn ?? globalThis.fetch;

  if (!ca || !EVM_CA.test(ca)) {
    throw new Error("analyzeToken: valid EVM contract address required");
  }
  if (chain !== "base") {
    throw new Error("analyzeToken: only base is supported in v2");
  }
  if (typeof fetchFn !== "function") {
    throw new Error("analyzeToken: no fetch implementation available — pass fetchFn");
  }

  const url = `${endpointUrl}/analyze/${ca.toLowerCase()}?chain=base`;
  const res = await fetchFn(url, { method: "GET" });

  if (!res.ok) {
    let detail = "";
    try {
      const body: any = await res.json();
      detail = body?.error ?? "";
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(`delu oracle ${res.status}: ${detail || "request failed"}`);
  }

  const data = (await res.json()) as OracleResponse;

  if (data.oracle_version !== "v2-full-cognition") {
    throw new Error(`delu oracle returned unexpected version: ${data.oracle_version}`);
  }
  return data;
}
