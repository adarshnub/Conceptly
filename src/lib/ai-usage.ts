import "server-only";

import { pool } from "@/db";

export type AiUsageFeature = "coach" | "class_voice" | "lesson_voice";
export type AiUsageStatus = "succeeded" | "failed" | "skipped";

export async function recordAiUsage(event: {
  userId: string;
  feature: AiUsageFeature;
  status: AiUsageStatus;
  model: string;
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
  inputCharacters?: number;
  audioSeconds?: number;
  estimatedCostMicrousd?: number | null;
  latencyMs?: number;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await pool.query(
      `insert into conceptly_private.ai_usage_events
        (user_id, feature, status, model, input_tokens, cached_input_tokens,
         output_tokens, input_characters, audio_seconds, estimated_cost_micro_usd,
         latency_ms, request_id, metadata)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)`,
      [
        event.userId,
        event.feature,
        event.status,
        event.model,
        event.inputTokens ?? 0,
        event.cachedInputTokens ?? 0,
        event.outputTokens ?? 0,
        event.inputCharacters ?? 0,
        event.audioSeconds ?? 0,
        event.estimatedCostMicrousd ?? null,
        event.latencyMs ?? null,
        event.requestId ?? null,
        JSON.stringify(event.metadata ?? {}),
      ],
    );
  } catch (error) {
    // Usage telemetry must never block grading, coaching, or narration.
    console.error("Unable to record AI usage event", error instanceof Error ? error.message : "unknown error");
  }
}

export type AiUsageDashboard = Awaited<ReturnType<typeof getAiUsageDashboard>>;

export async function getAiUsageDashboard(userId: string) {
  const [summaryResult, featuresResult, daysResult, recentResult] = await Promise.all([
    pool.query<{
      requests: string;
      succeeded: string;
      failed: string;
      skipped: string;
      input_tokens: string;
      cached_input_tokens: string;
      output_tokens: string;
      input_characters: string;
      audio_seconds: string;
      estimated_cost_microusd: string;
      unpriced_requests: string;
    }>(
      `select
         count(*)::text as requests,
         count(*) filter (where status = 'succeeded')::text as succeeded,
         count(*) filter (where status = 'failed')::text as failed,
         count(*) filter (where status = 'skipped')::text as skipped,
         coalesce(sum(input_tokens), 0)::text as input_tokens,
         coalesce(sum(cached_input_tokens), 0)::text as cached_input_tokens,
         coalesce(sum(output_tokens), 0)::text as output_tokens,
         coalesce(sum(input_characters), 0)::text as input_characters,
         coalesce(sum(audio_seconds), 0)::text as audio_seconds,
         coalesce(sum(estimated_cost_micro_usd), 0)::text as estimated_cost_microusd,
         count(*) filter (where status = 'succeeded' and estimated_cost_micro_usd is null)::text as unpriced_requests
       from conceptly_private.ai_usage_events
       where user_id = $1`,
      [userId],
    ),
    pool.query<{
      feature: AiUsageFeature;
      requests: string;
      succeeded: string;
      tokens: string;
      audio_seconds: string;
      estimated_cost_microusd: string;
    }>(
      `select feature,
         count(*)::text as requests,
         count(*) filter (where status = 'succeeded')::text as succeeded,
         coalesce(sum(input_tokens + output_tokens), 0)::text as tokens,
         coalesce(sum(audio_seconds), 0)::text as audio_seconds,
         coalesce(sum(estimated_cost_micro_usd), 0)::text as estimated_cost_microusd
       from conceptly_private.ai_usage_events
       where user_id = $1
       group by feature
       order by feature`,
      [userId],
    ),
    pool.query<{
      day: string;
      requests: string;
      estimated_cost_microusd: string;
    }>(
      `with days as (
         select generate_series(current_date - interval '13 days', current_date, interval '1 day')::date as day
       )
       select days.day::text,
         count(events.id)::text as requests,
         coalesce(sum(events.estimated_cost_micro_usd), 0)::text as estimated_cost_microusd
       from days
       left join conceptly_private.ai_usage_events events
         on events.user_id = $1 and events.created_at >= days.day and events.created_at < days.day + interval '1 day'
       group by days.day
       order by days.day`,
      [userId],
    ),
    pool.query<{
      id: string;
      feature: AiUsageFeature;
      status: AiUsageStatus;
      model: string;
      input_tokens: number;
      output_tokens: number;
      audio_seconds: number;
      estimated_cost_microusd: number | null;
      latency_ms: number | null;
      created_at: Date;
    }>(
      `select id, feature, status, model, input_tokens, output_tokens, audio_seconds,
         estimated_cost_micro_usd as estimated_cost_microusd, latency_ms, created_at
       from conceptly_private.ai_usage_events
       where user_id = $1
       order by created_at desc
       limit 12`,
      [userId],
    ),
  ]);

  const summary = summaryResult.rows[0];
  return {
    summary: {
      requests: Number(summary.requests),
      succeeded: Number(summary.succeeded),
      failed: Number(summary.failed),
      skipped: Number(summary.skipped),
      inputTokens: Number(summary.input_tokens),
      cachedInputTokens: Number(summary.cached_input_tokens),
      outputTokens: Number(summary.output_tokens),
      inputCharacters: Number(summary.input_characters),
      audioSeconds: Number(summary.audio_seconds),
      estimatedCostMicrousd: Number(summary.estimated_cost_microusd),
      unpricedRequests: Number(summary.unpriced_requests),
    },
    features: featuresResult.rows.map((row) => ({
      feature: row.feature,
      requests: Number(row.requests),
      succeeded: Number(row.succeeded),
      tokens: Number(row.tokens),
      audioSeconds: Number(row.audio_seconds),
      estimatedCostMicrousd: Number(row.estimated_cost_microusd),
    })),
    days: daysResult.rows.map((row) => ({
      day: row.day,
      requests: Number(row.requests),
      estimatedCostMicrousd: Number(row.estimated_cost_microusd),
    })),
    recent: recentResult.rows.map((row) => ({
      id: row.id,
      feature: row.feature,
      status: row.status,
      model: row.model,
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
      audioSeconds: row.audio_seconds,
      estimatedCostMicrousd: row.estimated_cost_microusd,
      latencyMs: row.latency_ms,
      createdAt: row.created_at.toISOString(),
    })),
  };
}
