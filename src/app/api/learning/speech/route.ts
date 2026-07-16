import OpenAI from "openai";
import { z } from "zod";
import { estimateAudioCostMicrousd, estimateNarrationSeconds } from "@/lib/ai-pricing";
import { recordAiUsage } from "@/lib/ai-usage";
import { getStepById } from "@/lib/content/course";
import { getEnv } from "@/lib/env";
import { getCurrentSession } from "@/lib/session";

export const runtime = "nodejs";

const requestSchema = z.object({
  stepId: z.string().min(1).max(100),
  purpose: z.enum(["question", "feedback", "coach"]),
  text: z.string().trim().min(1).max(2400),
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  const session = await getCurrentSession();
  if (!session?.user) {
    return Response.json({ error: { message: "Sign in required." } }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !getStepById(parsed.success ? parsed.data.stepId : "")) {
    return Response.json({ error: { message: "Invalid lesson narration request." } }, { status: 422 });
  }

  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    return Response.json(
      { error: { message: "OpenAI lesson narration is not configured." } },
      { status: 503 },
    );
  }

  const audioSeconds = estimateNarrationSeconds(parsed.data.text);
  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const speech = await openai.audio.speech.create(
      {
        model: env.OPENAI_TTS_MODEL,
        voice: env.OPENAI_TTS_VOICE as "cedar",
        input: parsed.data.text,
        instructions:
          parsed.data.purpose === "question"
            ? "Speak like a warm tutor presenting one short interactive exercise. Use clear pacing, small pauses before each option, and gentle emphasis on the task."
            : "Speak like a supportive tutor responding immediately to a learner. Sound natural and encouraging, never theatrical or robotic. Slow slightly for the explanatory cue.",
        response_format: "mp3",
      },
      { signal: AbortSignal.timeout(20_000) },
    );
    const audio = await speech.arrayBuffer();

    await recordAiUsage({
      userId: session.user.id,
      feature: "lesson_voice",
      status: "succeeded",
      model: env.OPENAI_TTS_MODEL,
      inputCharacters: parsed.data.text.length,
      audioSeconds,
      estimatedCostMicrousd: estimateAudioCostMicrousd(
        audioSeconds,
        env.OPENAI_TTS_USD_PER_MINUTE,
      ),
      latencyMs: Date.now() - startedAt,
      metadata: {
        stepId: parsed.data.stepId,
        purpose: parsed.data.purpose,
        voice: env.OPENAI_TTS_VOICE,
        durationIsEstimated: true,
      },
    });

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    await recordAiUsage({
      userId: session.user.id,
      feature: "lesson_voice",
      status: "failed",
      model: env.OPENAI_TTS_MODEL,
      inputCharacters: parsed.data.text.length,
      latencyMs: Date.now() - startedAt,
      metadata: { stepId: parsed.data.stepId, purpose: parsed.data.purpose },
    });
    return Response.json(
      { error: { message: "OpenAI lesson narration is temporarily unavailable." } },
      { status: 503 },
    );
  }
}
