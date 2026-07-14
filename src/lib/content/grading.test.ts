import { describe, expect, it } from "vitest";
import { aiFoundationsCourse, allSteps, getStepById } from "./course";
import { gradeStep, validateCourseContent } from "./grading";
import { toClientStep } from "./types";

describe("AI Foundations course content", () => {
  it("contains only the two default chapters and twenty ordered steps", () => {
    expect(aiFoundationsCourse.chapters.map((chapter) => chapter.title)).toEqual([
      "The Language of AI",
      "Markdown and JSON",
    ]);
    expect(allSteps).toHaveLength(20);
    expect(aiFoundationsCourse.chapters.every((chapter) => chapter.steps.length === 10)).toBe(true);
  });

  it("passes seed validation", () => {
    expect(() => validateCourseContent()).not.toThrow();
  });

  it("does not expose private solutions in client payloads", () => {
    const clientStep = toClientStep(allSteps[0]);
    expect(clientStep).not.toHaveProperty("solution");
    expect(clientStep).not.toHaveProperty("feedback");
    expect(clientStep.feedbackCodes.length).toBeGreaterThan(1);
  });
});

describe("deterministic grading", () => {
  it("grades single-choice misconceptions with authored feedback", () => {
    const step = getStepById("ai-c1-s1");
    expect(step).toBeTruthy();
    const result = gradeStep(step!, { selectedId: "generation" });
    expect(result.correct).toBe(false);
    expect(result.feedback.code).toBe("new_content");
  });

  it("grades ordering confusion", () => {
    const step = getStepById("ai-c1-s2");
    const result = gradeStep(step!, {
      order: ["data", "input", "training", "model", "output"],
    });
    expect(result.correct).toBe(false);
    expect(result.feedback.code).toBe("usage_before_training");
  });

  it("grades token-budget overflows and correct context choices", () => {
    const step = getStepById("ai-c1-s5");
    expect(
      gradeStep(step!, { selectedIds: ["policy", "purchase", "tone", "old"] }).feedback.code,
    ).toBe("over_budget");
    expect(
      gradeStep(step!, { selectedIds: ["policy", "purchase", "tone"] }).correct,
    ).toBe(true);
  });

  it("grades markdown and JSON editors", () => {
    expect(gradeStep(getStepById("ai-c2-s2")!, { text: "## AI Notes" }).feedback.code).toBe("wrong_level");
    expect(
      gradeStep(getStepById("ai-c2-s9")!, {
        text: '{"title":"AI","steps":[1,2]}',
      }).correct,
    ).toBe(true);
  });

  it("grades prompt-builder missing context", () => {
    const result = gradeStep(getStepById("ai-c1-s10")!, {
      text: "Write a status update for my manager in bullet format under 80 words.",
    });
    expect(result.correct).toBe(false);
    expect(result.feedback.code).toBe("missing_context");
  });
});
