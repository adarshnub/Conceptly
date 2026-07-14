import { allSteps } from "./course";
import type { Feedback, LessonStep } from "./types";

export type GradeResult = {
  correct: boolean;
  feedback: Feedback;
};

function asObject(answer: unknown): Record<string, unknown> {
  return typeof answer === "object" && answer !== null
    ? (answer as Record<string, unknown>)
    : {};
}

function stringValue(answer: unknown, keys: string[]) {
  if (typeof answer === "string") return answer;
  const object = asObject(answer);
  for (const key of keys) {
    if (typeof object[key] === "string") return object[key] as string;
  }
  return "";
}

function stringArray(answer: unknown, keys: string[]) {
  if (Array.isArray(answer)) return answer.filter((item) => typeof item === "string");
  const object = asObject(answer);
  for (const key of keys) {
    if (Array.isArray(object[key])) {
      return (object[key] as unknown[]).filter((item) => typeof item === "string");
    }
  }
  return [];
}

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((item) => b.includes(item));
}

function text(answer: unknown) {
  return stringValue(answer, ["text", "value", "prompt", "json"]).trim();
}

function lower(answer: unknown) {
  return text(answer).toLowerCase();
}

function getFeedback(step: LessonStep, code: string): Feedback {
  return (
    step.feedback[code] ??
    step.feedback.mismatch ??
    step.feedback.missing_criteria ??
    step.feedback.parse_error ??
    Object.values(step.feedback)[0]
  );
}

function codeForMarkdown(step: LessonStep, value: string) {
  const solution = step.solution;
  if (solution.type !== "markdown_editor") return "parse_error";

  if (solution.mode === "heading") {
    if (!value.trimStart().startsWith("#")) return "missing_hash";
    if (!value.trimStart().startsWith("# ")) return "wrong_level";
  }

  if (solution.mode === "inline") {
    if (!value.includes("**urgent**")) return "missing_bold";
    if (!value.includes("*draft*")) return "missing_italic";
    if (!value.includes("`status`")) return "missing_code";
  }

  if (solution.mode === "list") {
    if (!value.includes("1.") || !value.includes("2.")) return "missing_ordered";
    if (!value.includes("  - Check JSON") && !value.includes("    - Check JSON")) {
      return "missing_nested";
    }
  }

  if (solution.mode === "link_code") {
    if (!value.includes("[Docs](https://example.com)")) return "swapped_link";
    if (!value.includes("```json") || value.split("```").length < 3) {
      return "missing_fence";
    }
  }

  if (solution.mode === "repair") {
    if (!value.includes("# Title")) return "missing_heading";
    if (!value.includes("`npm test`")) return "missing_inline_code";
  }

  return "parse_error";
}

function gradeJson(step: LessonStep, value: string): GradeResult {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const solution = step.solution;
    if (solution.type !== "json_debugger") {
      return { correct: false, feedback: getFeedback(step, "parse_error") };
    }

    const missing = (solution.requiredKeys ?? []).find((key) => !(key in parsed));
    if (missing) return { correct: false, feedback: getFeedback(step, "missing_key") };

    if (solution.mode === "structured" && !Array.isArray(parsed.checks)) {
      return { correct: false, feedback: getFeedback(step, "checks_not_array") };
    }

    return { correct: true, feedback: step.correctFeedback };
  } catch {
    return { correct: false, feedback: getFeedback(step, "parse_error") };
  }
}

export function gradeStep(step: LessonStep, answer: unknown): GradeResult {
  const solution = step.solution;

  if (solution.type === "single_choice") {
    const selected = stringValue(answer, ["selectedId", "choiceId"]);
    if (selected === solution.correctId) {
      return { correct: true, feedback: step.correctFeedback };
    }
    const choice = step.prompt.choices?.find((item) => item.id === selected);
    return {
      correct: false,
      feedback: getFeedback(step, choice?.feedbackCode ?? "mismatch"),
    };
  }

  if (solution.type === "multi_select") {
    const selected = stringArray(answer, ["selectedIds", "choiceIds"]);
    if (sameSet(selected, solution.correctIds)) {
      return { correct: true, feedback: step.correctFeedback };
    }
    const wrong = selected.find((id) => !solution.correctIds.includes(id));
    return {
      correct: false,
      feedback: getFeedback(
        step,
        wrong ? solution.wrongChoiceCodes?.[wrong] ?? "mismatch" : "missing_criteria",
      ),
    };
  }

  if (solution.type === "ordering") {
    const order = stringArray(answer, ["order", "orderedIds"]);
    if (order.join("|") === solution.correctOrder.join("|")) {
      return { correct: true, feedback: step.correctFeedback };
    }
    const earlyWrong = order.find(
      (id, index) => id !== solution.correctOrder[index],
    );
    return {
      correct: false,
      feedback: getFeedback(
        step,
        earlyWrong ? solution.branchCodes?.[earlyWrong] ?? "order_mismatch" : "order_mismatch",
      ),
    };
  }

  if (solution.type === "matching") {
    const pairs = asObject(asObject(answer).pairs ?? answer) as Record<string, string>;
    const correct = Object.entries(solution.correctPairs).every(
      ([item, target]) => pairs[item] === target,
    );
    if (correct) return { correct: true, feedback: step.correctFeedback };

    const mismatch = Object.entries(solution.correctPairs).find(
      ([item, target]) => pairs[item] && pairs[item] !== target,
    );
    const code = mismatch
      ? solution.mismatchCodes?.[mismatch[0]]?.[pairs[mismatch[0]]] ?? "mismatch"
      : "mismatch";
    return { correct: false, feedback: getFeedback(step, code) };
  }

  if (solution.type === "token_budget") {
    const selected = stringArray(answer, ["selectedIds", "choiceIds"]);
    const weight = selected.reduce((sum, id) => {
      const item = step.prompt.items?.find((entry) => entry.id === id);
      return sum + (item?.weight ?? 0);
    }, 0);

    if (weight > solution.maxWeight) {
      return { correct: false, feedback: getFeedback(step, "over_budget") };
    }

    if (sameSet(selected, solution.correctIds)) {
      return { correct: true, feedback: step.correctFeedback };
    }

    const wrong = selected.find((id) => !solution.correctIds.includes(id));
    return {
      correct: false,
      feedback: getFeedback(
        step,
        wrong ? solution.wrongChoiceCodes?.[wrong] ?? "irrelevant_context" : "missing_relevant",
      ),
    };
  }

  if (solution.type === "markdown_editor") {
    const value = text(answer);
    const valid =
      solution.mode === "heading"
        ? value.trim() === solution.required[0]
        : solution.required.every((required) => value.includes(required));
    if (valid) return { correct: true, feedback: step.correctFeedback };
    return { correct: false, feedback: getFeedback(step, codeForMarkdown(step, value)) };
  }

  if (solution.type === "json_debugger") {
    return gradeJson(step, text(answer));
  }

  if (solution.type === "prompt_builder") {
    const value = lower(answer);
    if (!value.includes("manager")) return { correct: false, feedback: getFeedback(step, "missing_audience") };
    if (!value.includes("bullet") && !value.includes("format") && !value.includes("email")) {
      return { correct: false, feedback: getFeedback(step, "missing_format") };
    }
    if (!value.includes("under") && !value.includes("tone") && !value.includes("do not") && !value.includes("constraint")) {
      return { correct: false, feedback: getFeedback(step, "missing_constraints") };
    }
    if (!/\b(blocker|date|fact|milestone|win|risk)\b/.test(value)) {
      return { correct: false, feedback: getFeedback(step, "missing_context") };
    }
    return { correct: true, feedback: step.correctFeedback };
  }

  return { correct: false, feedback: getFeedback(step, "mismatch") };
}

export function validateCourseContent() {
  const errors: string[] = [];
  const ids = new Set<string>();

  if (allSteps.length !== 20) {
    errors.push(`Expected exactly 20 lesson steps, found ${allSteps.length}.`);
  }

  for (const step of allSteps) {
    if (ids.has(step.id)) errors.push(`Duplicate step id ${step.id}.`);
    ids.add(step.id);

    const feedbackCodes = new Set(Object.keys(step.feedback));
    if (feedbackCodes.size < 2) {
      errors.push(`${step.id} needs at least two authored misconception codes.`);
    }

    if (step.solution.type === "single_choice") {
      for (const choice of step.prompt.choices ?? []) {
        if (choice.id !== step.solution.correctId && !feedbackCodes.has(choice.feedbackCode ?? "")) {
          errors.push(`${step.id} choice ${choice.id} is missing feedback.`);
        }
      }
    }

    if (step.solution.type === "multi_select" || step.solution.type === "token_budget") {
      for (const [choiceId, code] of Object.entries(step.solution.wrongChoiceCodes ?? {})) {
        if (!feedbackCodes.has(code)) errors.push(`${step.id} ${choiceId} uses missing feedback ${code}.`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}
