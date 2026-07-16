import OpenAI from "openai";
import { NextResponse } from "next/server";
import { pool } from "@/db";
import { estimateTextCostMicrousd, normalizeResponseUsage } from "@/lib/ai-pricing";
import { recordAiUsage } from "@/lib/ai-usage";
import { getStepById } from "@/lib/content/course";
import { hashedSafetyIdentifier } from "@/lib/learning";
import { getEnv } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

const fallback = {
  explanation:
    "Use the authored feedback first: identify the exact part of your answer that conflicts with the lesson goal, then change only that part.",
  guidingQuestion: "Which clue in the prompt proves your selected answer?",
};

function safeCoachText(value: unknown) {
  if (typeof value !== "object" || value === null) return fallback;
  const object = value as Record<string, unknown>;
  if (
    typeof object.explanation !== "string" ||
    typeof object.guidingQuestion !== "string"
  ) {
    return fallback;
  }
  return {
    explanation: object.explanation.slice(0, 700),
    guidingQuestion: object.guidingQuestion.slice(0, 220),
  };
}

export async function POST(_request: Request, context: { params: Params }) {
  const requestStartedAt = Date.now();
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ error: { message: "Sign in required." } }, { status: 401 });
  }

  const { id } = await context.params;
  const env = getEnv();

  const intervention = await pool.query<{
    id: string;
    user_id: string;
    step_id: string;
    status: "pending" | "generated" | "fallback" | "failed";
  }>(
    `select id, user_id, step_id, status
     from conceptly_private.tutor_interventions
     where id = $1`,
    [id],
  );

  const row = intervention.rows[0];
  if (!row) return NextResponse.json({ error: { message: "Not found." } }, { status: 404 });
  if (row.user_id !== session.user.id) {
    return NextResponse.json({ error: { message: "Not allowed." } }, { status: 403 });
  }
  if (row.status !== "pending") {
    return NextResponse.json({ error: { message: "Coach response already handled." } }, { status: 409 });
  }

  const step = getStepById(row.step_id);
  if (!step) {
    return NextResponse.json({ error: { message: "Unknown lesson step." } }, { status: 422 });
  }

  if (!env.OPENAI_API_KEY) {
    await pool.query(
      `update conceptly_private.tutor_interventions
       set status = 'fallback', response = $2::jsonb
       where id = $1`,
      [id, JSON.stringify(fallback)],
    );
    await recordAiUsage({
      userId: session.user.id,
      feature: "coach",
      status: "skipped",
      model: env.OPENAI_MODEL,
      latencyMs: Date.now() - requestStartedAt,
      metadata: { reason: "missing_api_key", stepId: row.step_id },
    });
    return NextResponse.json(fallback);
  }

  try {
    const attempts = await pool.query<{ submitted_answer: unknown; feedback_code: string }>(
      `select submitted_answer, feedback_code
       from conceptly_private.step_attempts
       where user_id = $1 and step_id = $2 and is_correct = false
       order by created_at desc
       limit 4`,
      [session.user.id, step.id],
    );

    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const response = await client.responses.create(
      {
        model: env.OPENAI_MODEL,
        store: false,
        reasoning: { effort: "low" },
        max_output_tokens: 220,
        safety_identifier: hashedSafetyIdentifier(session.user.id),
        input: [
          {
            role: "developer",
            content:
              "You are Conceptly Coach. Help an adult beginner after repeated wrong attempts. Do not reveal the final answer. Stay under 120 words. Return only valid JSON with explanation and guidingQuestion.",
          },
          {
            role: "user",
            content: JSON.stringify({
              objective: step.tutorContext,
              visibleStep: {
                title: step.title,
                prompt: step.prompt,
              },
              recentWrongAttempts: attempts.rows.map((attempt) => ({
                answer: attempt.submitted_answer,
                authoredFeedback: step.feedback[attempt.feedback_code],
              })),
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "conceptly_coach",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["explanation", "guidingQuestion"],
              properties: {
                explanation: { type: "string" },
                guidingQuestion: { type: "string" },
              },
            },
          },
        },
      },
      { signal: AbortSignal.timeout(9000) },
    );

    const output = safeCoachText(JSON.parse(response.output_text || "{}"));
    const normalizedUsage = normalizeResponseUsage(response.usage);
    await pool.query(
      `update conceptly_private.tutor_interventions
       set status = 'generated', response = $2::jsonb, token_usage = $3::jsonb
       where id = $1`,
      [id, JSON.stringify(output), JSON.stringify(response.usage ?? null)],
    );
    await recordAiUsage({
      userId: session.user.id,
      feature: "coach",
      status: "succeeded",
      model: env.OPENAI_MODEL,
      ...normalizedUsage,
      estimatedCostMicrousd: estimateTextCostMicrousd(env.OPENAI_MODEL, response.usage),
      latencyMs: Date.now() - requestStartedAt,
      requestId: response.id,
      metadata: { stepId: row.step_id, interventionId: id },
    });

    return NextResponse.json(output);
  } catch {
    await pool.query(
      `update conceptly_private.tutor_interventions
       set status = 'fallback', response = $2::jsonb
       where id = $1`,
      [id, JSON.stringify(fallback)],
    );
    await recordAiUsage({
      userId: session.user.id,
      feature: "coach",
      status: "failed",
      model: env.OPENAI_MODEL,
      latencyMs: Date.now() - requestStartedAt,
      metadata: { stepId: row.step_id, interventionId: id },
    });
    return NextResponse.json(fallback);
  }
}
