"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Code2,
  Eye,
  FileJson,
  FileText,
  GraduationCap,
  Headphones,
  Lightbulb,
  LoaderCircle,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { buildAudioEnvelope, VoiceOrb } from "@/components/voice-orb";
import type {
  ChapterClassSession,
  ClassVisual,
} from "@/lib/content/class-sessions";

function splitNarration(text: string) {
  const segments = text
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
    ?.map((part) => part.trim())
    .filter(Boolean);
  return segments?.length ? segments : [text];
}

function TeachingVisual({ visual, revealed }: { visual: ClassVisual; revealed: boolean }) {
  if (visual.type === "task-cards") {
    return (
      <div className="demo-task-grid">
        {visual.items.map((item, index) => (
          <article className={`demo-task demo-accent-${item.accent}`} key={item.request}>
            <span className="demo-card-number">0{index + 1}</span>
            <p>{item.request}</p>
            <strong className={revealed ? "is-visible" : ""}>{item.label}</strong>
          </article>
        ))}
      </div>
    );
  }

  if (visual.type === "pipeline") {
    return (
      <div className="demo-pipeline">
        <div className={`demo-phase-label ${revealed ? "is-visible" : ""}`}>Training</div>
        <div className={`demo-phase-label demo-phase-use ${revealed ? "is-visible" : ""}`}>
          Using the model
        </div>
        <div className="demo-pipeline-row">
          {visual.nodes.map((node, index) => (
            <div className="demo-pipeline-step" key={node.label}>
              <span className={revealed ? `phase-${node.phase === "Training" ? "train" : "use"}` : ""}>
                {node.label}
              </span>
              {index < visual.nodes.length - 1 ? <ArrowRight aria-hidden="true" size={18} /> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visual.type === "token-window") {
    return (
      <div className="demo-token-layout">
        <div>
          <span className="demo-mini-label">What you type</span>
          <p className="demo-input-sentence">{visual.text}</p>
          <div className="demo-token-row" aria-label="The sentence split into tokens">
            {visual.tokens.map((token, index) => (
              <span key={`${token}-${index}`}>{token === " " ? "space" : token}</span>
            ))}
          </div>
        </div>
        <div className="demo-context-window">
          <div className="demo-window-top">
            <span>Context window</span>
            <span>3 / 3 cards</span>
          </div>
          {visual.context.map((item) => (
            <div
              className={`demo-context-card ${revealed ? (item.useful ? "is-useful" : "is-noise") : ""}`}
              key={item.text}
            >
              {item.text}
              {revealed ? item.useful ? <Check size={16} /> : <CircleAlert size={16} /> : null}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visual.type === "prompt-anatomy") {
    return (
      <div className="demo-prompt">
        <div className="demo-prompt-cursor" aria-hidden="true">›</div>
        <div className="demo-prompt-copy">
          {visual.parts.map((part) => (
            <span className={revealed ? `prompt-${part.accent}` : ""} key={part.label}>
              {revealed ? <small>{part.label}</small> : null}
              {part.text}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (visual.type === "evidence-check") {
    return (
      <div className="demo-evidence">
        <blockquote>“{visual.claim}”</blockquote>
        <div className="demo-checks">
          {visual.checks.map((check) => (
            <span
              className={revealed ? (check.state === "pass" ? "check-pass" : "check-warning") : ""}
              key={check.label}
            >
              {revealed ? check.state === "pass" ? <Check size={17} /> : <CircleAlert size={17} /> : <span />}
              {check.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (visual.type === "format-choice") {
    return (
      <div className="demo-format-grid">
        <div className="demo-format-panel">
          <div className="demo-format-title"><FileText size={19} /> Markdown</div>
          <pre>{visual.markdown.join("\n")}</pre>
          <strong className={revealed ? "is-visible" : ""}>For a person to read</strong>
        </div>
        <div className="demo-format-panel demo-format-json">
          <div className="demo-format-title"><FileJson size={19} /> JSON</div>
          <pre>{visual.json.join("\n")}</pre>
          <strong className={revealed ? "is-visible" : ""}>For software to parse</strong>
        </div>
      </div>
    );
  }

  if (visual.type === "markdown-render") {
    return (
      <div className="demo-render-grid">
        <div className="demo-source-pane">
          <span className="demo-mini-label"><Code2 size={14} /> You type</span>
          <pre>{visual.source.join("\n")}</pre>
        </div>
        <ArrowRight className="demo-render-arrow" aria-hidden="true" />
        <div className={`demo-rendered-pane ${revealed ? "is-rendered" : ""}`}>
          <span className="demo-mini-label"><Eye size={14} /> Reader sees</span>
          {visual.rendered.map((line, index) => {
            if (line.kind === "heading") return <h3 key={index}>{line.text}</h3>;
            if (line.kind === "bullet") return <p className="rendered-bullet" key={index}>• {line.text}</p>;
            if (line.kind === "code") return <p key={index}>Run <code>{line.text}</code></p>;
            return <p key={index}>{line.text}</p>;
          })}
        </div>
      </div>
    );
  }

  if (visual.type === "markdown-toolkit") {
    return (
      <div className="demo-toolkit-grid">
        {visual.items.map((item) => (
          <div className="demo-tool" key={item.label}>
            <span>{item.label}</span>
            <code>{item.syntax}</code>
            <ArrowRight size={16} />
            <strong className={revealed ? "is-visible" : ""}>{item.result}</strong>
          </div>
        ))}
      </div>
    );
  }

  if (visual.type === "json-anatomy") {
    return (
      <div className="demo-json-editor">
        <div className="demo-editor-top"><span /><span /><span /><small>lesson.json</small></div>
        <pre>
          {visual.lines.map((line, index) => (
            <span className="demo-json-line" key={index}>
              <i>{index + 1}</i><code>{line.code}</code>
              {revealed && line.label ? <em>{line.label}</em> : null}
            </span>
          ))}
        </pre>
      </div>
    );
  }

  return (
    <div className="demo-output-flow">
      <div className="demo-flow-input">{visual.input}</div>
      <ArrowRight aria-hidden="true" />
      <div className="demo-flow-json">
        {visual.fields.map((field) => (
          <p key={field.key}><span>“{field.key}”</span>: “{field.value}”</p>
        ))}
      </div>
      <ArrowRight aria-hidden="true" />
      <div className={revealed ? "demo-flow-destination is-visible" : "demo-flow-destination"}>
        <Sparkles size={20} /> {visual.destination}
      </div>
    </div>
  );
}

export function ClassSession({
  session,
  continueHref,
  courseHref,
}: {
  session: ChapterClassSession;
  continueHref: string;
  courseHref: string;
}) {
  const [activeBeat, setActiveBeat] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [started, setStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [activeNarrationSegment, setActiveNarrationSegment] = useState<number | null>(null);
  const [voiceMessage, setVoiceMessage] = useState("Natural narration is ready");
  const [autoNarrate, setAutoNarrate] = useState(true);
  const [voiceEnvelope, setVoiceEnvelope] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordedAudioUrlsRef = useRef(new Map<string, string>());
  const recordedEnvelopesRef = useRef(new Map<string, number[]>());
  const fallbackUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fallbackRunRef = useRef(0);
  const beat = session.beats[activeBeat];
  const isLastBeat = activeBeat === session.beats.length - 1;

  const stopNarration = useCallback(() => {
    audioRef.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      fallbackRunRef.current += 1;
      window.speechSynthesis.cancel();
    }
    fallbackUtteranceRef.current = null;
    setIsSpeaking(false);
    setIsLoadingVoice(false);
    setActiveNarrationSegment(null);
  }, []);

  const playBrowserFallback = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      setVoiceMessage("Narration is not supported in this browser");
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    setVoiceEnvelope([]);
    const runId = ++fallbackRunRef.current;
    const voices = window.speechSynthesis.getVoices();
    const preferredNames = ["Natural", "Enhanced", "Premium", "Aria", "Jenny", "Samantha", "Google US English"];
    const voice = voices.find((candidate) =>
      preferredNames.some((name) => candidate.name.toLowerCase().includes(name.toLowerCase())),
    ) ?? voices.find((candidate) => candidate.lang.toLowerCase().startsWith("en"));
    const segments = splitNarration(text);
    let segmentIndex = 0;

    const speakNextSegment = () => {
      if (runId !== fallbackRunRef.current) return;
      const segment = segments[segmentIndex];
      if (!segment) {
        setIsSpeaking(false);
        setActiveNarrationSegment(null);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(segment);
      utterance.voice = voice ?? null;
      utterance.rate = 0.96;
      utterance.pitch = 1;
      utterance.onstart = () => {
        setVoiceMessage(voice ? `Using ${voice.name}` : "Using your browser voice");
        setIsSpeaking(true);
        setActiveNarrationSegment(segmentIndex);
      };
      utterance.onend = () => {
        segmentIndex += 1;
        speakNextSegment();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setActiveNarrationSegment(null);
      };
      fallbackUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakNextSegment();
  }, []);

  const playNarration = useCallback(async (index: number) => {
    stopNarration();
    setIsLoadingVoice(true);
    setVoiceMessage("Loading recorded narration…");
    let recordedErrorReported = false;
    const reportRecordedAudioError = () => {
      if (recordedErrorReported) return;
      recordedErrorReported = true;
      setIsLoadingVoice(false);
      setIsSpeaking(false);
      setActiveNarrationSegment(null);
      setVoiceMessage("Saved OpenAI recording could not play · press Listen to retry");
    };

    try {
      const beatToPlay = session.beats[index];
      if (session.chapterSlug !== "language-of-ai") {
        setIsLoadingVoice(false);
        setVoiceMessage("Recorded narration for this chapter is coming later");
        playBrowserFallback(beatToPlay.narration);
        return;
      }
      const recordedAudioPath = `/audio/class-sessions/${session.chapterSlug}/${beatToPlay.id}.mp3`;
      let audioUrl = recordedAudioUrlsRef.current.get(recordedAudioPath);
      let envelope = recordedEnvelopesRef.current.get(recordedAudioPath) ?? [];
      if (!audioUrl) {
        const response = await fetch(recordedAudioPath);
        if (!response.ok) throw new Error("Saved narration could not be loaded.");
        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
        recordedAudioUrlsRef.current.set(recordedAudioPath, audioUrl);
        envelope = await buildAudioEnvelope(await audioBlob.arrayBuffer()).catch(() => []);
        recordedEnvelopesRef.current.set(recordedAudioPath, envelope);
      }
      setVoiceEnvelope(envelope);
      const audio = audioRef.current;
      if (!audio) {
        reportRecordedAudioError();
        return;
      }
      const narrationSegments = splitNarration(beatToPlay.narration);
      audio.preload = "auto";
      audio.src = audioUrl;
      audio.currentTime = 0;
      audio.onplay = () => {
        setIsLoadingVoice(false);
        setIsSpeaking(true);
        setActiveNarrationSegment(0);
        setVoiceMessage("Conceptly recorded class narration");
      };
      audio.ontimeupdate = () => {
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
        const segmentIndex = Math.min(
          narrationSegments.length - 1,
          Math.floor((audio.currentTime / audio.duration) * narrationSegments.length),
        );
        setActiveNarrationSegment(segmentIndex);
      };
      audio.onended = () => {
        setIsSpeaking(false);
        setActiveNarrationSegment(null);
      };
      audio.onerror = () => {
        reportRecordedAudioError();
      };
      audio.load();
      await audio.play();
    } catch {
      reportRecordedAudioError();
    }
  }, [playBrowserFallback, session.beats, session.chapterSlug, stopNarration]);

  const changeBeat = (nextIndex: number) => {
    stopNarration();
    setActiveBeat(nextIndex);
    setRevealed(false);
    if (started && autoNarrate) void playNarration(nextIndex);
  };

  const beginClass = () => {
    setStarted(true);
    void playNarration(0);
  };

  useEffect(() => {
    const audio = audioRef.current;
    const recordedAudioUrls = recordedAudioUrlsRef.current;
    return () => {
      audio?.pause();
      recordedAudioUrls.forEach((url) => URL.revokeObjectURL(url));
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <section className="classroom-shell">
      <audio ref={audioRef} preload="auto" className="hidden" aria-hidden="true" />
      <VoiceOrb
        audioRef={audioRef}
        envelope={voiceEnvelope}
        isSpeaking={isSpeaking || isLoadingVoice}
        tone="neutral"
        label={isLoadingVoice ? "Preparing narration" : isSpeaking ? "Conceptly is speaking" : "Class voice ready"}
      />
      <header className="classroom-nav">
        <Link className="icon-pill" href={courseHref} aria-label="Back to course">
          <ArrowLeft size={18} />
        </Link>
        <div className="classroom-progress" aria-label={`${activeBeat + 1} of ${session.beats.length} teaching moments`}>
          {session.beats.map((item, index) => (
            <button
              aria-label={`Go to ${item.stage}: ${item.title}`}
              className={index <= activeBeat ? "is-complete" : ""}
              key={item.id}
              onClick={() => changeBeat(index)}
              type="button"
            />
          ))}
        </div>
        <span className="classroom-counter">{activeBeat + 1} / {session.beats.length}</span>
      </header>

      <div className="classroom-frame">
        <div className="classroom-chrome">
          <span className="classroom-live-dot" />
          <span>{session.eyebrow}</span>
          <span className="classroom-duration">{session.duration}</span>
        </div>

        <div className="classroom-teacher-row">
          <div className={isSpeaking ? "teacher-avatar is-speaking" : "teacher-avatar"} aria-hidden="true">
            <GraduationCap size={24} />
            <span /><span />
          </div>
          <div>
            <strong>Conceptly teacher</strong>
            <span>{isLoadingVoice ? "Getting ready…" : isSpeaking ? "Explaining this example" : "Paused for you"}</span>
          </div>
          <div className="teacher-audio-controls">
            <button
              aria-label={isSpeaking ? "Stop narration" : "Play narration"}
              className="teacher-audio-button"
              disabled={isLoadingVoice}
              onClick={isSpeaking ? stopNarration : () => void playNarration(activeBeat)}
              type="button"
            >
              {isLoadingVoice ? <LoaderCircle className="animate-spin" size={18} /> : isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
              {isSpeaking ? "Stop" : "Listen"}
            </button>
            <label className="teacher-auto-toggle">
              <input checked={autoNarrate} onChange={(event) => setAutoNarrate(event.target.checked)} type="checkbox" />
              Auto narration
            </label>
          </div>
        </div>

        <main className="classroom-board">
          {!started ? (
            <div className="classroom-welcome">
              <div className="welcome-mark"><Headphones size={30} /></div>
              <p>{session.eyebrow}</p>
              <h1>{session.title}</h1>
              <span>{session.summary}</span>
              <button className="classroom-start-button" onClick={beginClass} type="button">
                <Play fill="currentColor" size={18} /> Begin class
              </button>
              <small>
                {session.chapterSlug === "language-of-ai"
                  ? "Chapter 1 uses prerecorded AI-generated narration. Captions follow the voice."
                  : "Recorded narration for Chapter 2 is coming later. Browser voice is available for now."}
              </small>
            </div>
          ) : (
            <div className="teaching-beat" key={beat.id}>
              <div className="teaching-copy">
                <p className="teaching-stage"><span>{activeBeat + 1}</span>{beat.stage}</p>
                <h1>{beat.title}</h1>
                <p className="teaching-caption">
                  {splitNarration(beat.narration).map((segment, index) => (
                    <span
                      className={activeNarrationSegment === index ? "is-being-read" : ""}
                      key={`${beat.id}-${index}`}
                    >
                      {segment}{" "}
                    </span>
                  ))}
                </p>
              </div>

              <div className="teaching-demo" aria-label={`Visual demonstration: ${beat.title}`}>
                <div className="demo-board-label"><span /> Live example</div>
                <TeachingVisual revealed={revealed} visual={beat.visual} />
              </div>

              <aside className={revealed ? "teacher-pause is-revealed" : "teacher-pause"}>
                <div className="teacher-pause-icon">{revealed ? <Lightbulb size={20} /> : <Eye size={20} />}</div>
                <div>
                  <span>{revealed ? "What to remember" : "Pause and notice"}</span>
                  <p>{revealed ? beat.takeaway : beat.learnerPrompt}</p>
                </div>
                {!revealed ? (
                  <button onClick={() => setRevealed(true)} type="button">{beat.revealLabel}</button>
                ) : null}
              </aside>
            </div>
          )}
        </main>

        {started ? (
          <footer className="classroom-footer">
            <div className="voice-status"><Headphones size={16} /><span>{voiceMessage}</span></div>
            <div className="classroom-actions">
              <button
                aria-label="Previous teaching moment"
                className="classroom-back-button"
                disabled={activeBeat === 0}
                onClick={() => changeBeat(activeBeat - 1)}
                type="button"
              >
                <ChevronLeft size={20} /> Back
              </button>
              {isLastBeat ? (
                <Link className="classroom-next-button" href={continueHref}>
                  Start questionnaire <ArrowRight size={18} />
                </Link>
              ) : (
                <button className="classroom-next-button" onClick={() => changeBeat(activeBeat + 1)} type="button">
                  Next idea <ChevronRight size={20} />
                </button>
              )}
            </div>
          </footer>
        ) : null}
      </div>
    </section>
  );
}
