"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type MutableRefObject } from "react";

const LandingCoreScene = dynamic(
  () => import("@/components/landing-core-3d").then((module) => module.LandingCoreScene),
  { ssr: false },
);

export function LandingCore({
  className = "",
  progressRef,
}: {
  className?: string;
  progressRef?: MutableRefObject<number>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "180px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className={`cl-core-shell ${className}`}
      aria-hidden="true"
      onPointerEnter={() => {
        hoverRef.current = 1;
      }}
      onPointerLeave={() => {
        hoverRef.current = 0;
        pointerRef.current.x = 0;
        pointerRef.current.y = 0;
      }}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        pointerRef.current.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointerRef.current.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);
      }}
    >
      <LandingCoreScene
        hoverRef={hoverRef}
        isVisible={isVisible}
        pointerRef={pointerRef}
        progressRef={progressRef}
        reducedMotion={reducedMotion}
      />
    </div>
  );
}
