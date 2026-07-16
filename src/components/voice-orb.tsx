"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AudioLines } from "lucide-react";

const VoiceCore3D = dynamic(
  () => import("@/components/voice-core-3d").then((module) => module.VoiceCore3D),
  { ssr: false },
);

export type VoiceOrbTone = "neutral" | "success" | "error" | "coach";

export function VoiceOrb({
  audioRef,
  envelope,
  isSpeaking,
  tone,
  label,
}: {
  audioRef?: { current: HTMLAudioElement | null };
  envelope?: number[];
  isSpeaking: boolean;
  tone: VoiceOrbTone;
  label?: string;
}) {
  const energyRef = useRef(0.06);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    let frame = 0;
    let previousEnergy = isSpeaking ? 0.16 : 0.06;

    const renderEnergy = (energy: number) => {
      energyRef.current = energy;
    };

    if (!isSpeaking || reducedMotion) {
      renderEnergy(isSpeaking ? 0.2 : previousEnergy);
      return;
    }

    const tick = () => {
      const audio = audioRef?.current;
      const duration = audio?.duration ?? 0;
      const progress = Number.isFinite(duration) && duration > 0
        ? Math.min(1, Math.max(0, (audio?.currentTime ?? 0) / duration))
        : 0;
      const activeEnvelope = envelope ?? [];
      const sampleIndex = Math.min(
        Math.max(0, activeEnvelope.length - 1),
        Math.floor(progress * Math.max(0, activeEnvelope.length - 1)),
      );
      const waveformEnergy = activeEnvelope[sampleIndex];
      const fallbackEnergy = 0.28 + Math.sin(performance.now() / 145) * 0.1;
      const targetEnergy = waveformEnergy === undefined
        ? fallbackEnergy
        : Math.min(1, Math.max(0.06, waveformEnergy));

      previousEnergy += (targetEnergy - previousEnergy) * 0.32;
      renderEnergy(previousEnergy);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [audioRef, envelope, isSpeaking, reducedMotion]);

  const status = label ?? (isSpeaking
    ? tone === "success"
      ? "Celebrating your answer"
      : tone === "error"
        ? "Explaining the cue"
        : tone === "coach"
          ? "Coach is speaking"
          : "Reading the challenge"
    : tone === "success"
      ? "Ready to continue"
      : tone === "error"
        ? "Try another path"
        : tone === "coach"
          ? "Coach cue ready"
          : "Voice ready");

  return (
    <div
      className={`voice-orb-presence tone-${tone} ${isSpeaking ? "is-speaking" : ""}`}
      role="status"
      aria-label={status}
    >
      <div className="voice-orb-visual" aria-hidden="true">
        <VoiceCore3D
          energyRef={energyRef}
          isSpeaking={isSpeaking}
          reducedMotion={reducedMotion}
          tone={tone}
        />
      </div>
      <span className="voice-orb-label">
        <AudioLines aria-hidden="true" size={14} strokeWidth={1.8} />
        {status}
      </span>
    </div>
  );
}

export async function buildAudioEnvelope(audioBytes: ArrayBuffer) {
  const AudioContextConstructor = window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return [];

  const context = new AudioContextConstructor();
  try {
    const buffer = await context.decodeAudioData(audioBytes.slice(0));
    const pointCount = Math.min(1400, Math.max(160, Math.ceil(buffer.duration * 36)));
    const blockSize = Math.max(1, Math.floor(buffer.length / pointCount));
    const sampleStride = Math.max(1, Math.floor(blockSize / 28));
    const points: number[] = [];

    for (let point = 0; point < pointCount; point += 1) {
      const start = point * blockSize;
      const end = Math.min(buffer.length, start + blockSize);
      let sumSquares = 0;
      let samples = 0;

      for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
        const data = buffer.getChannelData(channel);
        for (let index = start; index < end; index += sampleStride) {
          sumSquares += data[index] * data[index];
          samples += 1;
        }
      }

      points.push(samples ? Math.sqrt(sumSquares / samples) : 0);
    }

    const sorted = [...points].sort((a, b) => a - b);
    const reference = sorted[Math.floor(sorted.length * 0.94)] ?? 1;
    const normalizer = Math.max(0.01, reference);
    return points.map((point) => Math.min(1, Math.pow(point / normalizer, 0.72)));
  } finally {
    void context.close();
  }
}
