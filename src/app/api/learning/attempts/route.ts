import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAttempt } from "@/lib/learning";
import { getCurrentSession } from "@/lib/session";

export const runtime = "nodejs";

const attemptSchema = z.object({
  stepId: z.string().min(1),
  clientAttemptId: z.string().min(8),
  answer: z.unknown(),
});

function errorResponse(error: unknown) {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status: unknown }).status)
      : 503;
  const message =
    error instanceof Error
      ? error.message
      : "The attempt could not be recorded.";

  return NextResponse.json(
    { error: { message: status === 503 ? "Learning service is not ready." : message } },
    { status },
  );
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ error: { message: "Sign in required." } }, { status: 401 });
  }

  const parsed = attemptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Invalid attempt payload." } },
      { status: 422 },
    );
  }

  try {
    const result = await recordAttempt(
      session.user.id,
      parsed.data.stepId,
      parsed.data.clientAttemptId,
      parsed.data.answer,
    );

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
