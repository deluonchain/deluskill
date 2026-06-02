// delu oracle v2 — public response types
// matches the OracleResponse shape returned by the x402 endpoint

export type OracleVerdict = "strong_buy" | "buy" | "hold" | "avoid" | "drop";

export type MomentumDirection = "bullish" | "bearish" | "neutral";
export type MomentumStrength = "strong" | "moderate" | "weak";

export type BuyerPressure = "dominant" | "balanced" | "weak" | "unknown";
export type TxnIntensity = "high" | "normal" | "low";
export type FlowDataQuality = "full" | "estimated";

export type StructureState = "accumulation" | "markup" | "distribution" | "markdown" | "mixed";
export type StructureBias = "bullish" | "bearish" | "neutral";

export type VolatilityRegime = "low" | "normal" | "elevated" | "extreme";
export type AtrPctBand = "p0-p25" | "p25-p50" | "p50-p75" | "p75-p100";

export type LiquidityTier = "thin" | "moderate" | "deep" | "premium";
export type PoolAgeTier = "fresh" | "young" | "mature" | "veteran";

export type BaseEcoPulse = "expanding" | "contracting" | "flat";
export type MacroPulse = "supportive" | "neutral" | "headwind";

export type MandateAction = "enter" | "watch" | "avoid";

export interface OracleObservedMarket {
  liquidity_usd: number;
  volume_h1: number;
  volume_h24: number;
  price_change_h1: number;
  price_change_h24: number;
  atr_pct_1h: number | null;
  pool_age_days: number | null;
}

export interface OracleObserved {
  market: OracleObservedMarket;
  regime: { label: string; confidence: number };
  social: { status: "not_returned_raw" };
}

export interface OracleSignals {
  momentum: {
    h1_aligned_with_h24: boolean;
    direction: MomentumDirection;
    strength: MomentumStrength;
  };
  flow: {
    buyer_pressure: BuyerPressure;
    net_flow_h24_pct: number;
    txn_intensity: TxnIntensity;
    data_quality: FlowDataQuality;
  };
  structure: {
    state: StructureState;
    bias: StructureBias;
  };
  volatility: {
    regime: VolatilityRegime;
    atr_pct_1h: number | null;
    atr_pct_band: AtrPctBand;
  };
  liquidity: {
    depth_tier: LiquidityTier;
    liquidity_to_volume_ratio: number;
  };
}

export interface OracleContext {
  regime_label: string;
  regime_confidence: number;
  base_eco_pulse: BaseEcoPulse;
  macro_pulse: MacroPulse;
}

export interface OracleComparables {
  pool_age_percentile: PoolAgeTier;
  liquidity_tier: LiquidityTier;
  turnover_ratio_24h: number;
}

export interface OracleMandate {
  action: MandateAction;
  entry_zone: { low: number; high: number } | null;
  stop_loss: number | null;
  stop_basis: string | null;
  size_hint_pct: number | null;
  size_basis: string | null;
  horizon: string;
  invalidation: string;
}

export interface OracleResponse {
  ca: string;
  chain: "base";
  score: number;
  verdict: OracleVerdict;
  confidence: number;
  summary: string;
  drivers: string[];
  risks: string[];
  observed: OracleObserved;
  signals: OracleSignals;
  context: OracleContext;
  comparables: OracleComparables;
  mandate: OracleMandate;
  timestamp: string;
  oracle_version: "v2-full-cognition";
}

export interface AnalyzeTokenInput {
  ca: string;
  chain?: "base";
  endpointUrl?: string;
}

export const DELU_ORACLE_ENDPOINT =
  "https://x402.bankr.bot/0xed2ceca9de162c4f2337d7c1ab44ee9c427709da/delu-oracle";

export const DELU_ORACLE_PRICE_USDC = "0.25";
export const DELU_ORACLE_VERSION = "v2-full-cognition" as const;
