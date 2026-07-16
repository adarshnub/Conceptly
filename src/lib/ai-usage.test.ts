import { describe, expect, it } from "vitest";
import {
  estimateAudioCostMicrousd,
  estimateNarrationSeconds,
  estimateTextCostMicrousd,
  normalizeResponseUsage,
} from "./ai-pricing";

describe("AI usage calculations", () => {
  it("normalizes response usage", () => {
    expect(normalizeResponseUsage({
      input_tokens: 1000,
      output_tokens: 200,
      input_tokens_details: { cached_tokens: 400 },
    })).toEqual({ inputTokens: 1000, cachedInputTokens: 400, outputTokens: 200 });
  });

  it("prices uncached, cached, and output tokens separately", () => {
    expect(estimateTextCostMicrousd("gpt-5.6-luna", {
      input_tokens: 1_000_000,
      output_tokens: 1_000_000,
      input_tokens_details: { cached_tokens: 500_000 },
    })).toBe(6_550_000);
  });

  it("does not invent a price for an unknown model", () => {
    expect(estimateTextCostMicrousd("custom-model", { input_tokens: 100 })).toBeNull();
  });

  it("estimates narration duration and audio cost", () => {
    expect(estimateNarrationSeconds(Array(148).fill("word").join(" "))).toBe(60);
    expect(estimateAudioCostMicrousd(60, 0.015)).toBe(15_000);
  });
});
