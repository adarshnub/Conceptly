"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Braces, CheckCircle2, MousePointer2, Sparkles } from "lucide-react";
import { LandingCore } from "@/components/landing-core";
import sequenceManifest from "../../public/landing/scroll-sequence/manifest.json";

type SequenceManifest = {
  available: boolean;
  frameCount: number;
  pattern: string;
  width: number;
  height: number;
};

const ACTIVE_SEQUENCE: SequenceManifest = sequenceManifest;

const STORY_STEPS = [
  {
    eyebrow: "01 · Watch",
    title: "A class happens before the challenge.",
    copy: "Conceptly walks through the idea with staged demonstrations and voice narration, so the question has context before it asks for an answer.",
    icon: AudioLines,
  },
  {
    eyebrow: "02 · Touch",
    title: "Ideas become things you can manipulate.",
    copy: "Classify, sort, match, spend a context budget, repair Markdown, debug JSON, and build prompts directly in the lesson.",
    icon: MousePointer2,
  },
  {
    eyebrow: "03 · Understand",
    title: "Every wrong path teaches something specific.",
    copy: "The feedback is tied to the misconception behind the click. After repeated misses, the AI coach adds one focused guiding question.",
    icon: Sparkles,
  },
  {
    eyebrow: "04 · Apply",
    title: "Finish with formats AI work actually uses.",
    copy: "Move from AI vocabulary and evidence checks into practical Markdown and strict JSON—then review any completed step without losing progress.",
    icon: Braces,
  },
] as const;

export function LandingScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const drawFrameRef = useRef<((progress: number) => void) | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const manifest = ACTIVE_SEQUENCE;

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      progressRef.current = progress;
      drawFrameRef.current?.(progress);
      const nextStep = Math.min(STORY_STEPS.length - 1, Math.floor(progress * STORY_STEPS.length));
      setActiveStep((current) => current === nextStep ? current : nextStep);
      section.style.setProperty("--story-progress", String(progress));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const registerFrameRenderer = useCallback((renderer: ((progress: number) => void) | null) => {
    drawFrameRef.current = renderer;
    renderer?.(progressRef.current);
  }, []);

  return (
    <section ref={sectionRef} className="cl-story" aria-labelledby="cl-story-title">
      <div className="cl-story-sticky">
        <div className="cl-story-copy">
          <p className="cl-kicker">The Conceptly loop</p>
          <h2 id="cl-story-title">From explanation to instinct.</h2>
          <div className="cl-story-steps">
            {STORY_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <article className={index === activeStep ? "is-active" : ""} key={step.eyebrow}>
                  <div className="cl-story-icon"><Icon size={18} /></div>
                  <div>
                    <span>{step.eyebrow}</span>
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="cl-story-visual">
          <div className="cl-story-status">
            <span><i /> {manifest?.available ? "Frame sequence" : "Live 3D preview"}</span>
            <span>{String(activeStep + 1).padStart(2, "0")} / 04</span>
          </div>
          {manifest?.available ? (
            <FrameSequenceCanvas manifest={manifest} registerRenderer={registerFrameRenderer} />
          ) : (
            <LandingCore className="cl-story-core" progressRef={progressRef} />
          )}
          <div className="cl-story-caption">
            <CheckCircle2 size={16} />
            <span>{STORY_STEPS[activeStep].eyebrow.replace(/\d+ · /, "")}</span>
          </div>
        </div>

        <div className="cl-story-rail" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}

function FrameSequenceCanvas({
  manifest,
  registerRenderer,
}: {
  manifest: SequenceManifest;
  registerRenderer: (renderer: ((progress: number) => void) | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef(new Map<number, HTMLImageElement>());
  const lastProgressRef = useRef(0);

  useEffect(() => {
    const cache = cacheRef.current;
    let disposed = false;
    let animationFrame = 0;
    let currentProgress = lastProgressRef.current;
    let targetProgress = lastProgressRef.current;
    let previousTime = 0;

    const pathFor = (frame: number) => manifest.pattern.replace(
      "{frame}",
      String(frame + 1).padStart(4, "0"),
    );

    const paint = (image: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 1.6);
      const width = Math.max(1, Math.round(bounds.width * dpr));
      const height = Math.max(1, Math.round(bounds.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) return;
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    };

    const paintFrame = (frame: number) => {
      const image = cache.get(frame);
      if (!image?.complete || image.naturalWidth === 0) return false;
      paint(image);
      return true;
    };

    const paintClosestLoadedFrame = (frame: number) => {
      if (paintFrame(frame)) return;
      for (let offset = 1; offset < manifest.frameCount; offset += 1) {
        if (paintFrame(frame - offset) || paintFrame(frame + offset)) return;
      }
    };

    const load = (frame: number) => {
      const image = new window.Image();
      image.decoding = "async";
      image.fetchPriority = frame === 0 || frame % 36 === 0 ? "high" : "auto";
      image.onload = () => {
        if (disposed) return;
        const requestedFrame = Math.round(targetProgress * (manifest.frameCount - 1));
        if (frame === 0 || Math.abs(requestedFrame - frame) <= 1) paint(image);
      };
      image.src = pathFor(frame);
      cache.set(frame, image);
    };

    const scrub = (timestamp: number) => {
      if (disposed) return;
      const elapsed = previousTime ? Math.min(64, timestamp - previousTime) : 16;
      previousTime = timestamp;
      const response = 1 - Math.exp(-elapsed / 54);
      currentProgress += (targetProgress - currentProgress) * response;

      if (Math.abs(targetProgress - currentProgress) < 0.00012) {
        currentProgress = targetProgress;
      }
      const frame = Math.round(currentProgress * (manifest.frameCount - 1));
      paintClosestLoadedFrame(frame);

      if (currentProgress !== targetProgress) {
        animationFrame = requestAnimationFrame(scrub);
      } else {
        animationFrame = 0;
        previousTime = 0;
      }
    };

    const draw = (progress: number) => {
      targetProgress = Math.min(1, Math.max(0, progress));
      lastProgressRef.current = targetProgress;
      if (!animationFrame) animationFrame = requestAnimationFrame(scrub);
    };

    const keyFrames = [0, Math.floor(manifest.frameCount * 0.25), Math.floor(manifest.frameCount * 0.5), Math.floor(manifest.frameCount * 0.75), manifest.frameCount - 1];
    const preloadOrder = [
      ...keyFrames,
      ...Array.from({ length: manifest.frameCount }, (_, frame) => frame).filter((frame) => !keyFrames.includes(frame)),
    ];
    preloadOrder.forEach(load);

    const resizeObserver = new ResizeObserver(() => {
      const frame = Math.round(currentProgress * (manifest.frameCount - 1));
      paintClosestLoadedFrame(frame);
    });
    if (canvasRef.current) resizeObserver.observe(canvasRef.current);
    registerRenderer(draw);
    draw(0);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      registerRenderer(null);
      resizeObserver.disconnect();
      cache.forEach((image) => {
        image.onload = null;
      });
      cache.clear();
    };
  }, [manifest, registerRenderer]);

  return <canvas ref={canvasRef} className="cl-frame-canvas" aria-hidden="true" />;
}
