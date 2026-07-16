import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import OpenAI from "openai";
import { Pool } from "pg";
import { getAllChapterClassSessions } from "../src/lib/content/class-sessions";
import { estimateAudioCostMicrousd, estimateNarrationSeconds } from "../src/lib/ai-pricing";

config({ path: ".env.local", override: true });
config();

const DEFAULT_CHAPTER = "language-of-ai";
const INSTRUCTIONS =
  "Speak like a warm, thoughtful teacher guiding one adult beginner at a whiteboard. Use natural conversational pacing, varied intonation, brief pauses between ideas, and gentle emphasis on examples. Sound engaged and calm, never like an announcer or someone reading a document.";

type AudioManifest = {
  generatedAt: string;
  model: string;
  voice: string;
  entries: Record<string, { hash: string; file: string; usageLogged?: boolean }>;
};

function argument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function recordGenerationUsage({
  pool,
  beatId,
  chapterSlug,
  hash,
  model,
  voice,
  narration,
}: {
  pool: Pool | null;
  beatId: string;
  chapterSlug: string;
  hash: string;
  model: string;
  voice: string;
  narration: string;
}) {
  if (!pool) return false;
  const audioSeconds = estimateNarrationSeconds(narration);
  const usdPerMinute = Number(process.env.OPENAI_TTS_USD_PER_MINUTE ?? "0.015");
  const requestId = `prerecord:${hash}`;

  try {
    await pool.query(
      `insert into conceptly_private.ai_usage_events
        (user_id, feature, status, model, input_characters, audio_seconds,
         estimated_cost_micro_usd, request_id, metadata)
       select p.user_id, 'class_voice', 'succeeded', $1, $2, $3, $4, $5, $6::jsonb
       from conceptly_private.profiles p
       where not exists (
         select 1 from conceptly_private.ai_usage_events where request_id = $5
       )
       order by p.created_at
       limit 1`,
      [
        model,
        narration.length,
        audioSeconds,
        estimateAudioCostMicrousd(audioSeconds, usdPerMinute),
        requestId,
        JSON.stringify({
          chapterSlug,
          beatId,
          voice,
          prerecorded: true,
          durationIsEstimated: true,
        }),
      ],
    );
    return true;
  } catch (error) {
    console.warn(
      `Audio generated, but usage logging failed for ${beatId}:`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

async function main() {
  const chapterSlug = argument("chapter") ?? DEFAULT_CHAPTER;
  const force = process.argv.includes("--force");
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts";
  const voice = process.env.OPENAI_TTS_VOICE?.trim() || "cedar";

  if (!apiKey || apiKey.startsWith("sk-ant-")) {
    throw new Error(
      "A valid OpenAI API key is required only while generating the prerecorded MP3 files. The current OPENAI_API_KEY is missing or belongs to another provider.",
    );
  }

  const classSession = getAllChapterClassSessions().find(
    (session) => session.chapterSlug === chapterSlug,
  );
  if (!classSession) throw new Error(`Unknown class chapter: ${chapterSlug}`);

  const outputDirectory = path.join(
    process.cwd(),
    "public",
    "audio",
    "class-sessions",
    chapterSlug,
  );
  const manifestPath = path.join(outputDirectory, "manifest.json");
  await mkdir(outputDirectory, { recursive: true });

  let manifest: AudioManifest = {
    generatedAt: new Date(0).toISOString(),
    model,
    voice,
    entries: {},
  };
  if (await exists(manifestPath)) {
    manifest = JSON.parse(await readFile(manifestPath, "utf8")) as AudioManifest;
  }

  const openai = new OpenAI({ apiKey });
  const usagePool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : null;
  let generated = 0;
  let skipped = 0;

  for (const beat of classSession.beats) {
    const filename = `${beat.id}.mp3`;
    const outputPath = path.join(outputDirectory, filename);
    const hash = createHash("sha256")
      .update(JSON.stringify({ narration: beat.narration, model, voice, instructions: INSTRUCTIONS }))
      .digest("hex");
    const current = manifest.entries[beat.id];

    if (!force && current?.hash === hash && (await exists(outputPath))) {
      if (!current.usageLogged) {
        current.usageLogged = await recordGenerationUsage({
          pool: usagePool,
          beatId: beat.id,
          chapterSlug,
          hash,
          model,
          voice,
          narration: beat.narration,
        });
      }
      skipped += 1;
      console.log(`Skipped unchanged: ${filename}`);
      continue;
    }

    console.log(`Generating: ${filename}`);
    const speech = await openai.audio.speech.create({
      model,
      voice: voice as "cedar",
      input: beat.narration,
      instructions: INSTRUCTIONS,
      response_format: "mp3",
    });
    await writeFile(outputPath, Buffer.from(await speech.arrayBuffer()));
    manifest.entries[beat.id] = {
      hash,
      file: filename,
      usageLogged: await recordGenerationUsage({
        pool: usagePool,
        beatId: beat.id,
        chapterSlug,
        hash,
        model,
        voice,
        narration: beat.narration,
      }),
    };
    generated += 1;
  }

  manifest = {
    ...manifest,
    generatedAt: new Date().toISOString(),
    model,
    voice,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await usagePool?.end();
  console.log(`Chapter ${chapterSlug}: generated ${generated}, skipped ${skipped}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
