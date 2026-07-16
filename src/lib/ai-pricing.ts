type ResponseUsage = {
  input_tokens?: number;
  output_tokens?: number;
  input_tokens_details?: { cached_tokens?: number };
};

type ModelPricing = {
  inputUsdPerMillion: number;
  cachedInputUsdPerMillion: number;
  outputUsdPerMillion: number;
};

// Standard-tier rates verified from OpenAI's pricing page on 2026-07-15.
// Unknown models intentionally return null instead of displaying a misleading cost.
const textPricing: Array<[prefix: string, pricing: ModelPricing]> = [
  ["gpt-5.6-luna", { inputUsdPerMillion: 1, cachedInputUsdPerMillion: 0.1, outputUsdPerMillion: 6 }],
  ["gpt-4.1-mini", { inputUsdPerMillion: 0.4, cachedInputUsdPerMillion: 0.1, outputUsdPerMillion: 1.6 }],
  ["gpt-4.1-nano", { inputUsdPerMillion: 0.1, cachedInputUsdPerMillion: 0.025, outputUsdPerMillion: 0.4 }],
  ["gpt-4.1", { inputUsdPerMillion: 2, cachedInputUsdPerMillion: 0.5, outputUsdPerMillion: 8 }],
  ["gpt-4o-mini", { inputUsdPerMillion: 0.15, cachedInputUsdPerMillion: 0.075, outputUsdPerMillion: 0.6 }],
];

export function normalizeResponseUsage(usage: ResponseUsage | null | undefined) {
  return {
    inputTokens: Math.max(0, usage?.input_tokens ?? 0),
    cachedInputTokens: Math.max(0, usage?.input_tokens_details?.cached_tokens ?? 0),
    outputTokens: Math.max(0, usage?.output_tokens ?? 0),
  };
}

export function estimateTextCostMicrousd(model: string, usage: ResponseUsage | null | undefined) {
  const rate = textPricing.find(([prefix]) => model === prefix || model.startsWith(`${prefix}-`))?.[1];
  if (!rate) return null;

  const normalized = normalizeResponseUsage(usage);
  const cached = Math.min(normalized.cachedInputTokens, normalized.inputTokens);
  const uncached = normalized.inputTokens - cached;
  const usd =
    (uncached / 1_000_000) * rate.inputUsdPerMillion +
    (cached / 1_000_000) * rate.cachedInputUsdPerMillion +
    (normalized.outputTokens / 1_000_000) * rate.outputUsdPerMillion;

  return Math.round(usd * 1_000_000);
}

export function estimateNarrationSeconds(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round((words / 147) * 60));
}

export function estimateAudioCostMicrousd(seconds: number, usdPerMinute: number) {
  return Math.round((Math.max(0, seconds) / 60) * usdPerMinute * 1_000_000);
}
