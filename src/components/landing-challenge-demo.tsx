"use client";

import { useState } from "react";
import { ArrowRight, Check, RotateCcw, Volume2, X } from "lucide-react";

const choices = [
  {
    id: "classification",
    label: "Classification",
    correct: true,
    feedback: "Exactly. The system chooses one label from a fixed set.",
  },
  {
    id: "prediction",
    label: "Prediction",
    correct: false,
    feedback: "Prediction estimates an unknown value. This task sorts a message into a known category.",
  },
  {
    id: "generation",
    label: "Generation",
    correct: false,
    feedback: "Generation creates new content. Here, the output must be one of three existing labels.",
  },
] as const;

export function LandingChallengeDemo() {
  const [selected, setSelected] = useState<(typeof choices)[number] | null>(null);

  return (
    <div className={`cl-demo ${selected?.correct ? "is-correct" : selected ? "is-wrong" : ""}`}>
      <div className="cl-demo-topbar">
        <span>Try a real interaction</span>
        <div className="cl-demo-progress"><span /></div>
        <span>01 / 20</span>
      </div>
      <div className="cl-demo-body">
        <div className="cl-demo-prompt">
          <span className="cl-demo-label">Interactive challenge</span>
          <h3>Classification, prediction, or generation?</h3>
          <p>A support inbox marks each incoming message as billing, bug, or account access.</p>
          <div className="cl-demo-audio"><Volume2 size={16} /> Voice can read this aloud</div>
        </div>
        <div className="cl-demo-options">
          {choices.map((choice, index) => {
            const isSelected = selected?.id === choice.id;
            return (
              <button
                className={isSelected ? "is-selected" : ""}
                key={choice.id}
                onClick={() => setSelected(choice)}
                type="button"
              >
                <span>{index + 1}</span>
                <strong>{choice.label}</strong>
                {isSelected ? choice.correct ? <Check size={18} /> : <X size={18} /> : <i />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="cl-demo-feedback" aria-live="polite">
        {selected ? (
          <>
            <div className="cl-demo-feedback-icon">
              {selected.correct ? <Check size={20} /> : <X size={20} />}
            </div>
            <div>
              <strong>{selected.correct ? "That fits." : "Here’s the distinction."}</strong>
              <p>{selected.feedback}</p>
            </div>
            <button onClick={() => setSelected(null)} type="button">
              <RotateCcw size={16} /> Again
            </button>
          </>
        ) : (
          <>
            <span>Choose an answer. Every path has its own explanation.</span>
            <ArrowRight size={18} />
          </>
        )}
      </div>
    </div>
  );
}
