"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { ClientLessonStep, Feedback } from "@/lib/content/types";

type AttemptResult = {
  correct: boolean;
  feedback: Feedback;
  progress: {
    stepCompleted: boolean;
    nextStepSlug: string | null;
    chapterCompleted: boolean;
    xpAwarded: number;
    streak: number;
  };
  tutorTrigger: { interventionId: string } | null;
};

type Coach = {
  explanation: string;
  guidingQuestion: string;
};

export function LessonPlayer({
  step,
  stepNumber,
  totalSteps,
  nextHref,
  courseHref,
}: {
  step: ClientLessonStep;
  stepNumber: number;
  totalSteps: number;
  nextHref: string | null;
  courseHref: string;
}) {
  const [answer, setAnswer] = useState<unknown>(() => defaultAnswer(step));
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [error, setError] = useState("");
  const [voiceSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window,
  );
  const [autoRead, setAutoRead] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("conceptly:auto-read") === "true",
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPending, startTransition] = useTransition();
  const progress = Math.round((stepNumber / totalSteps) * 100);
  const questionSpeech = useMemo(() => getQuestionSpeech(step), [step]);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.94;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (voiceSupported) window.speechSynthesis.cancel();
    };
  }, [voiceSupported]);

  useEffect(() => {
    if (voiceSupported && autoRead) {
      speak(questionSpeech);
    }
  }, [autoRead, questionSpeech, speak, step.id, voiceSupported]);

  function submit() {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/learning/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stepId: step.id,
          clientAttemptId: crypto.randomUUID(),
          answer,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error?.message ?? "Your answer could not be checked.");
        return;
      }

      const payload = (await response.json()) as AttemptResult;
      setResult(payload);
      if (autoRead && !payload.tutorTrigger) {
        speak(getResultSpeech(payload));
      }

      if (payload.tutorTrigger) {
        const coachResponse = await fetch(
          `/api/tutor/interventions/${payload.tutorTrigger.interventionId}/generate`,
          { method: "POST" },
        );
        if (coachResponse.ok) {
          const coachPayload = (await coachResponse.json()) as Coach;
          setCoach(coachPayload);
          if (autoRead) {
            speak(`${getResultSpeech(payload)} Conceptly Coach cue. ${coachPayload.explanation} ${coachPayload.guidingQuestion}`);
          }
        }
      }
    });
  }

  const canContinue = result?.correct;

  return (
    <section className="lesson-shell">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link className="icon-pill" href={courseHref} aria-label="Exit lesson">
          <X size={18} />
        </Link>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--line)]">
          <div
            className="h-full rounded-full bg-[var(--indigo)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-[var(--muted)]">
          {stepNumber}/{totalSteps}
        </span>
        {voiceSupported ? (
          <div className="voice-strip" aria-label="Voice controls">
            <button
              className="voice-button"
              onClick={() => speak(questionSpeech)}
              type="button"
            >
              <Volume2 size={17} />
              Read
            </button>
            <button
              className="voice-icon"
              onClick={stopSpeaking}
              disabled={!isSpeaking}
              type="button"
              aria-label="Stop voice"
            >
              <VolumeX size={17} />
            </button>
            <label className="voice-toggle">
              <input
                type="checkbox"
                checked={autoRead}
                onChange={(event) => {
                  const enabled = event.target.checked;
                  setAutoRead(enabled);
                  localStorage.setItem("conceptly:auto-read", String(enabled));
                  if (enabled) speak(questionSpeech);
                  else stopSpeaking();
                }}
              />
              Auto
            </label>
          </div>
        ) : null}
      </div>

      <div className="lesson-card">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--indigo)]">
          {step.kind.replaceAll("_", " ")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
          {step.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-[var(--muted)]">{step.prompt.stem}</p>

        <div className="mt-8">
          <Renderer step={step} answer={answer} setAnswer={setAnswer} disabled={Boolean(result?.correct)} />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button className="primary-button" onClick={submit} disabled={isPending || Boolean(result?.correct)} type="button">
            {isPending ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
            Check answer
          </button>
          {canContinue && nextHref ? (
            <Link className="secondary-button" href={nextHref}>
              Continue
              <ArrowRight size={18} />
            </Link>
          ) : canContinue ? (
            <Link className="secondary-button" href="/learn">
              Finish
              <ArrowRight size={18} />
            </Link>
          ) : null}
        </div>

        {error ? <FeedbackBox tone="error" feedback={{ code: "error", title: "Not checked", body: error }} /> : null}
        {result ? (
          <FeedbackBox tone={result.correct ? "success" : "error"} feedback={result.feedback} xp={result.progress.xpAwarded} />
        ) : null}
        {coach ? <CoachBox coach={coach} /> : null}
      </div>
    </section>
  );
}

function getQuestionSpeech(step: ClientLessonStep) {
  const pieces = [
    `Step ${step.order}. ${step.title}.`,
    step.prompt.stem,
    step.prompt.instruction,
  ];
  const choices = step.prompt.choices ?? step.prompt.items ?? [];
  if (choices.length > 0) {
    pieces.push(
      `Options. ${choices
        .map((choice, index) => `${index + 1}. ${choice.label}`)
        .join(". ")}.`,
    );
  }
  if (step.prompt.targets?.length) {
    pieces.push(
      `Match targets. ${step.prompt.targets
        .map((target) => target.label)
        .join(". ")}.`,
    );
  }
  if (step.prompt.starter && (step.kind === "markdown_editor" || step.kind === "json_debugger")) {
    pieces.push(`Starter text. ${step.prompt.starter}`);
  }
  return pieces.filter(Boolean).join(" ");
}

function getResultSpeech(result: AttemptResult) {
  if (result.correct) {
    const xp = result.progress.xpAwarded
      ? `You earned ${result.progress.xpAwarded} XP.`
      : "";
    return `Correct. Nice work. ${result.feedback.title}. ${result.feedback.body} ${xp}`;
  }

  return `Not quite yet. ${result.feedback.title}. Here is the cue. ${result.feedback.body}`;
}

function defaultAnswer(step: ClientLessonStep): unknown {
  if (step.kind === "multi_select" || step.kind === "token_budget") return { selectedIds: [] };
  if (step.kind === "ordering") return { order: step.prompt.items?.map((item) => item.id) ?? [] };
  if (step.kind === "matching") return { pairs: {} };
  if (step.kind === "markdown_editor" || step.kind === "json_debugger" || step.kind === "prompt_builder") {
    return { text: step.prompt.starter ?? "" };
  }
  return { selectedId: "" };
}

function Renderer({
  step,
  answer,
  setAnswer,
  disabled,
}: {
  step: ClientLessonStep;
  answer: unknown;
  setAnswer: (answer: unknown) => void;
  disabled: boolean;
}) {
  if (step.kind === "single_choice") {
    const selected = (answer as { selectedId?: string }).selectedId ?? "";
    return (
      <div className="grid gap-3" role="radiogroup" aria-label={step.prompt.instruction}>
        {step.prompt.choices?.map((choice) => (
          <button
            key={choice.id}
            className={`answer-option ${selected === choice.id ? "answer-option-selected" : ""}`}
            onClick={() => setAnswer({ selectedId: choice.id })}
            disabled={disabled}
            type="button"
          >
            {choice.label}
          </button>
        ))}
      </div>
    );
  }

  if (step.kind === "multi_select" || step.kind === "token_budget") {
    const selected = new Set((answer as { selectedIds?: string[] }).selectedIds ?? []);
    const total = step.prompt.items
      ? [...selected].reduce((sum, id) => sum + (step.prompt.items?.find((item) => item.id === id)?.weight ?? 0), 0)
      : 0;
    const options = step.prompt.choices ?? step.prompt.items ?? [];
    return (
      <div className="grid gap-3">
        {step.prompt.budget ? (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold">
            Budget used: {total}/{step.prompt.budget}
          </div>
        ) : null}
        {options.map((choice) => (
          <label key={choice.id} className="answer-option cursor-pointer">
            <input
              className="h-5 w-5 accent-[var(--indigo)]"
              type="checkbox"
              checked={selected.has(choice.id)}
              disabled={disabled}
              onChange={() => {
                const next = new Set(selected);
                if (next.has(choice.id)) next.delete(choice.id);
                else next.add(choice.id);
                setAnswer({ selectedIds: [...next] });
              }}
            />
            <span>{choice.label}</span>
            {"weight" in choice && choice.weight ? (
              <span className="ml-auto text-sm text-[var(--muted)]">{choice.weight} pts</span>
            ) : null}
          </label>
        ))}
      </div>
    );
  }

  if (step.kind === "ordering") {
    const order = (answer as { order?: string[] }).order ?? [];
    const items = step.prompt.items ?? [];
    const labelFor = (id: string) => items.find((item) => item.id === id)?.label ?? id;
    const move = (index: number, direction: -1 | 1) => {
      const next = [...order];
      const target = index + direction;
      if (target < 0 || target >= next.length) return;
      [next[index], next[target]] = [next[target], next[index]];
      setAnswer({ order: next });
    };
    return (
      <ol className="grid gap-3">
        {order.map((id, index) => (
          <li key={id} className="answer-option">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--paper)] font-mono text-sm">
              {index + 1}
            </span>
            <span className="flex-1">{labelFor(id)}</span>
            <button className="icon-pill" onClick={() => move(index, -1)} disabled={disabled || index === 0} type="button" aria-label="Move up">
              <ChevronUp size={17} />
            </button>
            <button className="icon-pill" onClick={() => move(index, 1)} disabled={disabled || index === order.length - 1} type="button" aria-label="Move down">
              <ChevronDown size={17} />
            </button>
          </li>
        ))}
      </ol>
    );
  }

  if (step.kind === "matching") {
    const pairs = (answer as { pairs?: Record<string, string> }).pairs ?? {};
    return (
      <div className="grid gap-3">
        {step.prompt.items?.map((item) => (
          <label className="field-label rounded-lg border border-[var(--line)] bg-white p-4" key={item.id}>
            <span>{item.label}</span>
            <select
              className="field-input"
              value={pairs[item.id] ?? ""}
              disabled={disabled}
              onChange={(event) => setAnswer({ pairs: { ...pairs, [item.id]: event.target.value } })}
            >
              <option value="">Choose a match</option>
              {step.prompt.targets?.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }

  return <EditorRenderer step={step} answer={answer} setAnswer={setAnswer} disabled={disabled} />;
}

function EditorRenderer({
  step,
  answer,
  setAnswer,
  disabled,
}: {
  step: ClientLessonStep;
  answer: unknown;
  setAnswer: (answer: unknown) => void;
  disabled: boolean;
}) {
  const value = (answer as { text?: string }).text ?? "";
  const jsonStatus = useMemo(() => {
    if (step.kind !== "json_debugger") return "";
    try {
      JSON.parse(value);
      return "Valid JSON";
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid JSON";
    }
  }, [step.kind, value]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <label className="field-label">
        {step.prompt.instruction}
        <textarea
          className="field-input min-h-64 font-mono text-sm leading-7"
          value={value}
          placeholder={step.prompt.placeholder}
          disabled={disabled}
          onChange={(event) => setAnswer({ text: event.target.value })}
        />
      </label>
      <div className="rounded-lg border border-[var(--line)] bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-[var(--muted)]">
          {step.kind === "json_debugger" ? jsonStatus : "Preview"}
        </p>
        {step.kind === "json_debugger" ? (
          <pre className="overflow-auto rounded-lg bg-[var(--paper)] p-4 font-mono text-sm">
            {value}
          </pre>
        ) : step.kind === "prompt_builder" ? (
          <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">{value}</p>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackBox({
  feedback,
  tone,
  xp,
}: {
  feedback: Feedback;
  tone: "success" | "error";
  xp?: number;
}) {
  return (
    <div className={`mt-6 rounded-lg border p-4 ${tone === "success" ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900"}`}>
      <div className="flex items-start gap-3">
        {tone === "success" ? <Check size={20} /> : <ArrowLeft size={20} />}
        <div>
          <p className="font-semibold">{feedback.title}</p>
          <p className="mt-1 text-sm leading-6">{feedback.body}</p>
          {xp ? <p className="mt-2 text-sm font-semibold">+{xp} XP</p> : null}
        </div>
      </div>
    </div>
  );
}

function CoachBox({ coach }: { coach: Coach }) {
  return (
    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div className="flex items-start gap-3">
        <Sparkles size={20} />
        <div>
          <p className="font-semibold">Conceptly Coach</p>
          <p className="mt-1 text-sm leading-6">{coach.explanation}</p>
          <p className="mt-3 text-sm font-semibold">{coach.guidingQuestion}</p>
        </div>
      </div>
    </div>
  );
}
