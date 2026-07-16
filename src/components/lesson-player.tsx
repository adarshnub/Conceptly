"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  GripVertical,
  Lightbulb,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { buildAudioEnvelope, VoiceOrb, type VoiceOrbTone } from "@/components/voice-orb";
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

type LiveCriterion = { label: string; met: boolean };
type SpeechCue = { id: string; text: string };
type SpeechPurpose = "question" | "feedback" | "coach";
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
  const [voiceError, setVoiceError] = useState("");
  const [autoRead, setAutoRead] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("conceptly:auto-read") === "true",
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechCue, setActiveSpeechCue] = useState<string | null>(null);
  const speechRunRef = useRef(0);
  const speechAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechRequestRef = useRef<AbortController | null>(null);
  const speechAudioUrlsRef = useRef(new Map<string, string>());
  const speechEnvelopesRef = useRef(new Map<string, number[]>());
  const [voiceEnvelope, setVoiceEnvelope] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();
  const progress = Math.round((stepNumber / totalSteps) * 100);
  const questionCues = useMemo(() => getQuestionCues(step), [step]);
  const criteria = useMemo(() => getLiveCriteria(step, answer), [answer, step]);
  const answerReady = criteria.every((criterion) => criterion.met);

  const speak = useCallback(async (cues: SpeechCue[], purpose: SpeechPurpose = "question") => {
    const runId = ++speechRunRef.current;
    speechRequestRef.current?.abort();
    speechAudioRef.current?.pause();
    const controller = new AbortController();
    speechRequestRef.current = controller;
    const narration = cues.map((cue) => cue.text).join(" ");
    const cacheKey = `${step.id}:${purpose}:${narration}`;

    try {
      let audioUrl = speechAudioUrlsRef.current.get(cacheKey);
      let envelope = speechEnvelopesRef.current.get(cacheKey) ?? [];
      if (!audioUrl) {
        const response = await fetch("/api/learning/speech", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ stepId: step.id, purpose, text: narration }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error?.message ?? "OpenAI narration could not be generated.");
        }
        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        speechAudioUrlsRef.current.set(cacheKey, audioUrl);
        envelope = await buildAudioEnvelope(await audioBlob.arrayBuffer()).catch(() => []);
        speechEnvelopesRef.current.set(cacheKey, envelope);
      }

      if (runId !== speechRunRef.current) return;
      setVoiceEnvelope(envelope);
      const audio = speechAudioRef.current;
      if (!audio) throw new Error("The OpenAI audio player is not ready.");
      const totalWeight = Math.max(1, cues.reduce((total, cue) => total + cue.text.length, 0));

      audio.src = audioUrl;
      audio.currentTime = 0;
      audio.onplay = () => {
        setVoiceError("");
        setIsSpeaking(true);
        setActiveSpeechCue(cues[0]?.id ?? null);
      };
      audio.ontimeupdate = () => {
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
        const spokenWeight = (audio.currentTime / audio.duration) * totalWeight;
        let cumulative = 0;
        const activeCue = cues.find((cue) => {
          cumulative += cue.text.length;
          return spokenWeight <= cumulative;
        });
        setActiveSpeechCue(activeCue?.id ?? cues.at(-1)?.id ?? null);
      };
      audio.onended = () => {
        setIsSpeaking(false);
        setActiveSpeechCue(null);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setActiveSpeechCue(null);
        setVoiceError("OpenAI audio could not play. Press Read question to retry.");
      };
      audio.load();
      await audio.play();
    } catch (speechError) {
      if (controller.signal.aborted) return;
      setIsSpeaking(false);
      setActiveSpeechCue(null);
      setVoiceError(
        speechError instanceof Error
          ? speechError.message
          : "OpenAI narration is unavailable.",
      );
    }
  }, [step.id]);

  const stopSpeaking = useCallback(() => {
    speechRunRef.current += 1;
    speechRequestRef.current?.abort();
    speechAudioRef.current?.pause();
    setIsSpeaking(false);
    setActiveSpeechCue(null);
  }, []);

  useEffect(() => {
    const audio = speechAudioRef.current;
    const urls = speechAudioUrlsRef.current;
    return () => {
      speechRunRef.current += 1;
      speechRequestRef.current?.abort();
      audio?.pause();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (!autoRead) return;
    const timeout = window.setTimeout(() => {
      void speak(questionCues, "question");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [autoRead, questionCues, speak, step.id]);

  function updateAnswer(next: unknown) {
    setAnswer(next);
    if (!result?.correct) {
      setResult(null);
      setCoach(null);
      setError("");
    }
  }

  function submit(answerToCheck: unknown) {
    const submittedAnswerReady = getLiveCriteria(step, answerToCheck).every(
      (criterion) => criterion.met,
    );
    if (!submittedAnswerReady) return;
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/learning/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stepId: step.id,
          clientAttemptId: crypto.randomUUID(),
          answer: answerToCheck,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error?.message ?? "Your answer could not be checked.");
        return;
      }

      const payload = (await response.json()) as AttemptResult;
      setResult(payload);
      if (autoRead && !payload.tutorTrigger) void speak(getResultSpeechCues(payload), "feedback");

      if (payload.tutorTrigger) {
        const coachResponse = await fetch(
          `/api/tutor/interventions/${payload.tutorTrigger.interventionId}/generate`,
          { method: "POST" },
        );
        if (coachResponse.ok) {
          const coachPayload = (await coachResponse.json()) as Coach;
          setCoach(coachPayload);
          if (autoRead) {
            void speak([
              ...getResultSpeechCues(payload),
              { id: "coach-explanation", text: `Conceptly Coach cue. ${coachPayload.explanation}` },
              { id: "coach-question", text: coachPayload.guidingQuestion },
            ], "coach");
          }
        }
      }
    });
  }

  const continueHref = nextHref ?? "/learn";
  const voiceOrbTone: VoiceOrbTone = coach
    ? "coach"
    : result?.correct
      ? "success"
      : result
        ? "error"
        : "neutral";

  return (
    <section className="lesson-experience">
      <audio ref={speechAudioRef} preload="none" className="hidden" aria-hidden="true" />
      <VoiceOrb
        audioRef={speechAudioRef}
        envelope={voiceEnvelope}
        isSpeaking={isSpeaking}
        tone={voiceOrbTone}
      />
      <header className="lesson-topbar">
        <Link className="lesson-icon-button" href={courseHref} aria-label="Exit lesson">
          <X size={21} />
        </Link>
        <div className="lesson-progress-wrap" aria-label={`${progress}% through the course`}>
          <div className="lesson-progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="lesson-progress-dots" aria-hidden="true">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} className={progress >= (index + 1) * 25 ? "is-filled" : ""} />
            ))}
          </div>
        </div>
        <div className="lesson-step-count">
          <strong>{stepNumber}</strong>
          <span>/ {totalSteps}</span>
        </div>
      </header>

      <div className={`lesson-stage ${result?.correct ? "is-correct" : result ? "is-wrong" : ""}`}>
        <div className="lesson-stage-tools">
          <span className="lesson-kind-pill">{kindLabel(step.kind)}</span>
          <div className="lesson-voice-wrap">
            <div className="lesson-voice-controls" aria-label="OpenAI voice controls">
              <button onClick={() => void speak(questionCues, "question")} type="button">
                <Volume2 size={17} />
                OpenAI voice
              </button>
              <button
                className="lesson-voice-icon"
                onClick={stopSpeaking}
                disabled={!isSpeaking}
                type="button"
                aria-label="Stop voice"
              >
                <VolumeX size={17} />
              </button>
              <label>
                <input
                  type="checkbox"
                  checked={autoRead}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setAutoRead(enabled);
                    localStorage.setItem("conceptly:auto-read", String(enabled));
                    if (enabled) void speak(questionCues, "question");
                    else stopSpeaking();
                  }}
                />
                Auto
              </label>
            </div>
            {voiceError ? <span className="lesson-voice-error" role="status">{voiceError}</span> : null}
          </div>
        </div>

        <main className="lesson-workspace">
          <div className="lesson-brief">
            <p className="lesson-eyebrow">Interactive challenge</p>
            <h1 className={activeSpeechCue === "title" ? "is-being-read" : ""}>{step.title}</h1>
            <p className={activeSpeechCue === "stem" ? "is-being-read" : ""}>{step.prompt.stem}</p>
            <div className={`lesson-instruction ${activeSpeechCue === "instruction" ? "is-being-read" : ""}`}>
              <Lightbulb size={17} />
              <span>{step.prompt.instruction}</span>
            </div>
            <div className="lesson-criteria" aria-label="Challenge checks">
              {criteria.map((criterion) => (
                <div className={criterion.met ? "is-met" : ""} key={criterion.label}>
                  {criterion.met ? <Check size={16} /> : <Circle size={15} />}
                  <span>{criterion.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lesson-interaction-board">
            <div className="lesson-board-heading">
              <span>Working area</span>
              <small>Changes appear instantly</small>
            </div>
            <Renderer
              step={step}
              answer={answer}
              setAnswer={updateAnswer}
              disabled={Boolean(result?.correct)}
              onImmediateSubmit={submit}
              busy={isPending}
              activeSpeechCue={activeSpeechCue}
            />
          </div>
        </main>

        <footer className="lesson-action-bar">
          <div className="lesson-feedback-slot" aria-live="polite">
            {error ? (
              <FeedbackBox
                tone="error"
                feedback={{ code: "error", title: "Not checked", body: error }}
                activeSpeechCue={activeSpeechCue}
              />
            ) : result ? (
              <FeedbackBox
                tone={result.correct ? "success" : "error"}
                feedback={result.feedback}
                xp={result.progress.xpAwarded}
                activeSpeechCue={activeSpeechCue}
              />
            ) : (
              <p>Select or build your answer, then check it.</p>
            )}
            {coach ? <CoachBox coach={coach} activeSpeechCue={activeSpeechCue} /> : null}
          </div>
          <div className="lesson-primary-actions">
            {result?.correct ? (
              <Link className="lesson-continue-button" href={continueHref}>
                {nextHref ? "Continue" : "Finish"}
                <ArrowRight size={19} />
              </Link>
            ) : step.kind === "single_choice" ? (
              <button className="lesson-check-button" disabled type="button">
                {isPending ? <Loader2 className="animate-spin" size={19} /> : <Circle size={18} />}
                {isPending ? "Checking…" : result ? "Choose another answer" : "Choose an answer"}
              </button>
            ) : (
              <button
                className="lesson-check-button"
                onClick={() => submit(answer)}
                disabled={isPending || !answerReady}
                type="button"
              >
                {isPending ? <Loader2 className="animate-spin" size={19} /> : <Check size={19} />}
                Check answer
              </button>
            )}
          </div>
        </footer>
      </div>
    </section>
  );
}

function kindLabel(kind: ClientLessonStep["kind"]) {
  return {
    single_choice: "Choose",
    multi_select: "Select",
    ordering: "Arrange",
    matching: "Connect",
    token_budget: "Build",
    markdown_editor: "Write",
    json_debugger: "Debug",
    prompt_builder: "Create",
  }[kind];
}

function getLiveCriteria(step: ClientLessonStep, answer: unknown): LiveCriterion[] {
  if (step.kind === "single_choice") {
    return [{ label: "Choose one response", met: Boolean((answer as { selectedId?: string }).selectedId) }];
  }

  if (step.kind === "multi_select") {
    const count = (answer as { selectedIds?: string[] }).selectedIds?.length ?? 0;
    return [{ label: "Select every item that applies", met: count > 0 }];
  }

  if (step.kind === "token_budget") {
    const selected = new Set((answer as { selectedIds?: string[] }).selectedIds ?? []);
    const total = [...selected].reduce(
      (sum, id) => sum + (step.prompt.items?.find((item) => item.id === id)?.weight ?? 0),
      0,
    );
    return [
      { label: "Add at least one useful fact", met: selected.size > 0 },
      { label: `Stay within ${step.prompt.budget ?? 0} context points`, met: total <= (step.prompt.budget ?? 0) },
    ];
  }

  if (step.kind === "ordering") {
    const count = (answer as { order?: string[] }).order?.length ?? 0;
    return [{ label: "Place every stage in the sequence", met: count === (step.prompt.items?.length ?? 0) }];
  }

  if (step.kind === "matching") {
    const pairs = (answer as { pairs?: Record<string, string> }).pairs ?? {};
    return [{ label: "Give every item one match", met: Object.keys(pairs).length === (step.prompt.items?.length ?? 0) }];
  }

  const value = (answer as { text?: string }).text?.trim() ?? "";
  if (step.kind === "json_debugger") {
    let valid = false;
    try {
      JSON.parse(value);
      valid = true;
    } catch {
      valid = false;
    }
    return [
      { label: "Edit the starter", met: value !== (step.prompt.starter ?? "").trim() },
      { label: "JSON parses without syntax errors", met: valid },
    ];
  }

  return [{ label: "Edit the working draft", met: value !== (step.prompt.starter ?? "").trim() }];
}

function getQuestionCues(step: ClientLessonStep): SpeechCue[] {
  const cues: SpeechCue[] = [
    { id: "title", text: `Step ${step.order}. ${step.title}.` },
    { id: "stem", text: step.prompt.stem },
    { id: "instruction", text: step.prompt.instruction },
  ];
  const choices = step.prompt.choices ?? step.prompt.items ?? [];
  if (choices.length > 0) {
    cues.push(
      ...choices.map((choice, index) => ({
        id: `choice-${choice.id}`,
        text: `${index + 1}. ${choice.label}.`,
      })),
    );
  }
  if (step.prompt.targets?.length) {
    cues.push(
      ...step.prompt.targets.map((target) => ({
        id: `target-${target.id}`,
        text: `Match target. ${target.label}.`,
      })),
    );
  }
  if (step.prompt.starter && (step.kind === "markdown_editor" || step.kind === "json_debugger")) {
    cues.push({ id: "editor", text: `Starter text. ${step.prompt.starter}` });
  }
  return cues.filter((cue) => Boolean(cue.text));
}

function getResultSpeechCues(result: AttemptResult): SpeechCue[] {
  if (result.correct) {
    const xp = result.progress.xpAwarded ? `You earned ${result.progress.xpAwarded} XP.` : "";
    return [
      { id: "feedback-title", text: `Correct. Nice work. ${result.feedback.title}.` },
      { id: "feedback-body", text: `${result.feedback.body} ${xp}` },
    ];
  }
  return [
    { id: "feedback-title", text: `Not quite yet. ${result.feedback.title}.` },
    { id: "feedback-body", text: `Here is the cue. ${result.feedback.body}` },
  ];
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
  onImmediateSubmit,
  busy,
  activeSpeechCue,
}: {
  step: ClientLessonStep;
  answer: unknown;
  setAnswer: (answer: unknown) => void;
  disabled: boolean;
  onImmediateSubmit: (answer: unknown) => void;
  busy: boolean;
  activeSpeechCue: string | null;
}) {
  if (step.kind === "single_choice") {
    const selected = (answer as { selectedId?: string }).selectedId ?? "";
    return (
      <div className="lesson-choice-grid" role="radiogroup" aria-label={step.prompt.instruction}>
        {step.prompt.choices?.map((choice, index) => (
          <button
            key={choice.id}
            className={`${selected === choice.id ? "is-selected" : ""} ${activeSpeechCue === `choice-${choice.id}` ? "is-being-read" : ""}`}
            onClick={() => {
              const nextAnswer = { selectedId: choice.id };
              setAnswer(nextAnswer);
              onImmediateSubmit(nextAnswer);
            }}
            disabled={disabled || busy}
            type="button"
            role="radio"
            aria-checked={selected === choice.id}
          >
            <span className="lesson-choice-key">{index + 1}</span>
            <span>{choice.label}</span>
            <span className="lesson-choice-state">
              {selected === choice.id ? <Check size={17} /> : <Circle size={16} />}
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (step.kind === "multi_select" || step.kind === "token_budget") {
    const selected = new Set((answer as { selectedIds?: string[] }).selectedIds ?? []);
    const total = step.prompt.items
      ? [...selected].reduce(
          (sum, id) => sum + (step.prompt.items?.find((item) => item.id === id)?.weight ?? 0),
          0,
        )
      : 0;
    const options = step.prompt.choices ?? step.prompt.items ?? [];
    return (
      <div className="lesson-select-builder">
        {step.prompt.budget ? (
          <div className={`lesson-budget-meter ${total > step.prompt.budget ? "is-over" : ""}`}>
            <div>
              <span>Context tray</span>
              <strong>{total} / {step.prompt.budget}</strong>
            </div>
            <div className="lesson-budget-track">
              <span style={{ width: `${Math.min(100, (total / step.prompt.budget) * 100)}%` }} />
            </div>
          </div>
        ) : null}
        <div className="lesson-select-grid">
          {options.map((choice) => {
            const active = selected.has(choice.id);
            return (
              <button
                key={choice.id}
                className={`${active ? "is-selected" : ""} ${activeSpeechCue === `choice-${choice.id}` ? "is-being-read" : ""}`}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => {
                  const next = new Set(selected);
                  if (next.has(choice.id)) next.delete(choice.id);
                  else next.add(choice.id);
                  setAnswer({ selectedIds: [...next] });
                }}
              >
                <span className="lesson-select-toggle">{active ? <Minus size={17} /> : <Plus size={17} />}</span>
                <span>{choice.label}</span>
                {"weight" in choice && choice.weight ? <small>{choice.weight} pts</small> : null}
              </button>
            );
          })}
        </div>
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
      <ol className="lesson-order-list">
        {order.map((id, index) => (
          <li className={activeSpeechCue === `choice-${id}` ? "is-being-read" : ""} key={id}>
            <GripVertical className="lesson-grip" size={18} />
            <span className="lesson-order-number">{index + 1}</span>
            <span className="lesson-order-label">{labelFor(id)}</span>
            <div>
              <button onClick={() => move(index, -1)} disabled={disabled || index === 0} type="button" aria-label={`Move ${labelFor(id)} up`}>
                <ChevronUp size={18} />
              </button>
              <button onClick={() => move(index, 1)} disabled={disabled || index === order.length - 1} type="button" aria-label={`Move ${labelFor(id)} down`}>
                <ChevronDown size={18} />
              </button>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  if (step.kind === "matching") {
    const pairs = (answer as { pairs?: Record<string, string> }).pairs ?? {};
    return (
      <div className="lesson-match-grid">
        <div className="lesson-match-targets" aria-label="Available match targets">
          {step.prompt.targets?.map((target) => (
            <span
              className={activeSpeechCue === `target-${target.id}` ? "is-being-read" : ""}
              key={target.id}
            >
              {target.label}
            </span>
          ))}
        </div>
        {step.prompt.items?.map((item) => (
          <label className={activeSpeechCue === `choice-${item.id}` ? "is-being-read" : ""} key={item.id}>
            <span className="lesson-match-source">{item.label}</span>
            <ArrowRight size={17} aria-hidden="true" />
            <select
              value={pairs[item.id] ?? ""}
              disabled={disabled}
              onChange={(event) => setAnswer({ pairs: { ...pairs, [item.id]: event.target.value } })}
            >
              <option value="">Choose a match</option>
              {step.prompt.targets?.map((target) => (
                <option key={target.id} value={target.id}>{target.label}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }

  return (
    <EditorRenderer
      step={step}
      answer={answer}
      setAnswer={setAnswer}
      disabled={disabled}
      activeSpeechCue={activeSpeechCue}
    />
  );
}

function EditorRenderer({
  step,
  answer,
  setAnswer,
  disabled,
  activeSpeechCue,
}: {
  step: ClientLessonStep;
  answer: unknown;
  setAnswer: (answer: unknown) => void;
  disabled: boolean;
  activeSpeechCue: string | null;
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
    <div className={`lesson-editor-grid ${activeSpeechCue === "editor" ? "is-being-read" : ""}`}>
      <label>
        <span>Editor</span>
        <textarea
          value={value}
          placeholder={step.prompt.placeholder}
          disabled={disabled}
          onChange={(event) => setAnswer({ text: event.target.value })}
          spellCheck={step.kind === "prompt_builder"}
        />
      </label>
      <div className="lesson-preview-panel">
        <div className="lesson-preview-heading">
          <span>{step.kind === "json_debugger" ? "Parser" : "Live preview"}</span>
          {step.kind === "json_debugger" ? (
            <small className={jsonStatus === "Valid JSON" ? "is-valid" : ""}>{jsonStatus}</small>
          ) : null}
        </div>
        {step.kind === "json_debugger" ? (
          <pre>{value}</pre>
        ) : step.kind === "prompt_builder" ? (
          <p className="lesson-prompt-preview">{value || "Your prompt will appear here."}</p>
        ) : (
          <div className="lesson-prose">
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
  activeSpeechCue,
}: {
  feedback: Feedback;
  tone: "success" | "error";
  xp?: number;
  activeSpeechCue: string | null;
}) {
  return (
    <div className={`lesson-feedback ${tone === "success" ? "is-success" : "is-error"}`}>
      <span className="lesson-feedback-icon">
        {tone === "success" ? <Check size={19} /> : <Lightbulb size={19} />}
      </span>
      <div>
        <strong className={activeSpeechCue === "feedback-title" ? "is-being-read" : ""}>{feedback.title}</strong>
        <p className={activeSpeechCue === "feedback-body" ? "is-being-read" : ""}>{feedback.body}</p>
        {xp ? <small>+{xp} XP</small> : null}
      </div>
    </div>
  );
}

function CoachBox({ coach, activeSpeechCue }: { coach: Coach; activeSpeechCue: string | null }) {
  return (
    <div className="lesson-coach-card">
      <Sparkles size={18} />
      <div>
        <strong>Conceptly Coach</strong>
        <p className={activeSpeechCue === "coach-explanation" ? "is-being-read" : ""}>{coach.explanation}</p>
        <span className={activeSpeechCue === "coach-question" ? "is-being-read" : ""}>{coach.guidingQuestion}</span>
      </div>
    </div>
  );
}
