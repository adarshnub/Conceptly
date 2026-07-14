import { z } from "zod";

export const feedbackSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const stepKindSchema = z.enum([
  "single_choice",
  "multi_select",
  "ordering",
  "matching",
  "token_budget",
  "markdown_editor",
  "json_debugger",
  "prompt_builder",
]);

export type StepKind = z.infer<typeof stepKindSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;

export type Choice = {
  id: string;
  label: string;
  feedbackCode?: string;
};

export type LessonPrompt = {
  stem: string;
  instruction: string;
  concept?: string;
  choices?: Choice[];
  items?: { id: string; label: string; detail?: string; weight?: number }[];
  targets?: { id: string; label: string }[];
  starter?: string;
  budget?: number;
  placeholder?: string;
};

export type LessonSolution =
  | { type: "single_choice"; correctId: string }
  | { type: "multi_select"; correctIds: string[]; wrongChoiceCodes?: Record<string, string> }
  | { type: "ordering"; correctOrder: string[]; branchCodes?: Record<string, string> }
  | { type: "matching"; correctPairs: Record<string, string>; mismatchCodes?: Record<string, Record<string, string>> }
  | { type: "token_budget"; correctIds: string[]; maxWeight: number; wrongChoiceCodes?: Record<string, string> }
  | { type: "markdown_editor"; mode: "heading" | "inline" | "list" | "link_code" | "repair"; required: string[] }
  | { type: "json_debugger"; mode: "valid_json" | "types" | "structured"; requiredKeys?: string[] }
  | { type: "prompt_builder"; required: string[] };

export type LessonStep = {
  id: string;
  slug: string;
  chapterSlug: string;
  order: number;
  kind: StepKind;
  title: string;
  prompt: LessonPrompt;
  solution: LessonSolution;
  feedback: Record<string, Feedback>;
  correctFeedback: Feedback;
  tutorContext: string;
  xp: number;
};

export type LessonChapter = {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  steps: LessonStep[];
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  chapters: LessonChapter[];
};

export type ClientLessonStep = Omit<LessonStep, "solution" | "feedback"> & {
  feedbackCodes: string[];
};

export function toClientStep(step: LessonStep): ClientLessonStep {
  return {
    id: step.id,
    slug: step.slug,
    chapterSlug: step.chapterSlug,
    order: step.order,
    kind: step.kind,
    title: step.title,
    prompt: step.prompt,
    correctFeedback: step.correctFeedback,
    tutorContext: step.tutorContext,
    xp: step.xp,
    feedbackCodes: Object.keys(step.feedback),
  };
}
