"use client";

import { useEffect, useRef } from "react";
import { motion, useIsPresent } from "framer-motion";
import { AlertCircle, ArrowRight, Check, Loader2 } from "lucide-react";
import { AnswerControl } from "@/features/respondent/answer-control";
import { isEmpty } from "@/features/respondent/validation";
import type { Question } from "@/types/form";
import type { AnswerValue } from "@/types/respondent";

function keyboardHint(question: Question) {
  if (question.type === "long_text")
    return "Enter or Shift + Enter for a new line";
  if (question.type === "dropdown")
    return "Use arrow keys to choose · Tab to continue";
  if (question.type === "yes_no") return "Y or N to choose · Enter to continue";
  if (question.type === "rating") return "1–5 to choose · Enter to continue";
  if (question.type === "multiple_choice")
    return "Letter keys to choose · Enter to continue";
  return "press Enter ↵";
}

export function QuestionScreen({
  question,
  index,
  value,
  error,
  last,
  submitting,
  navigating,
  direction,
  reducedMotion,
  onChange,
  onNext,
  onReady,
}: {
  question: Question;
  index: number;
  value: AnswerValue | undefined;
  error?: string;
  last: boolean;
  submitting: boolean;
  navigating: boolean;
  direction: number;
  reducedMotion: boolean;
  onChange: (value: AnswerValue) => void;
  onNext: () => void;
  onReady: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const isPresent = useIsPresent();
  useEffect(() => {
    if (isPresent)
      ref.current
        ?.querySelector<HTMLElement>("[data-primary]")
        ?.focus({ preventScroll: true });
  }, [question.id, isPresent]);
  return (
    <motion.form
      ref={ref}
      className="public-question-screen"
      noValidate
      aria-busy={submitting}
      aria-hidden={!isPresent}
      inert={!isPresent}
      custom={direction}
      variants={{
        enter: (movement: number) => ({
          opacity: reducedMotion ? 1 : 0,
          y: reducedMotion ? 0 : movement * 32,
        }),
        center: { opacity: 1, y: 0 },
        exit: (movement: number) => ({
          opacity: reducedMotion ? 1 : 0,
          y: reducedMotion ? 0 : movement * -24,
        }),
      }}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: reducedMotion ? 0 : 0.14, ease: "easeOut" }}
      onAnimationComplete={onReady}
      onSubmit={(event) => {
        event.preventDefault();
        onNext();
      }}
      aria-labelledby={`question-${question.id}`}
    >
      <div className="public-question-heading">
        <span className="question-number" aria-hidden="true">
          {index + 1}
          <ArrowRight size={17} />
        </span>
        <h1 id={`question-${question.id}`}>
          {question.title}
          {question.required && (
            <span className="public-required" aria-label="required">
              {" "}
              *
            </span>
          )}
        </h1>
      </div>
      <div className="public-question-content">
        {question.description && (
          <p id={`description-${question.id}`} className="public-description">
            {question.description}
          </p>
        )}
        <AnswerControl
          question={question}
          value={value}
          disabled={submitting || !isPresent}
          error={error}
          onChange={onChange}
        />
        {error && (
          <p id={`error-${question.id}`} className="public-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </p>
        )}
        <div className="public-continue">
          <button
            type="submit"
            className="public-primary"
            disabled={submitting || navigating}
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="spin" />
                Sending…
              </>
            ) : last ? (
              "Submit"
            ) : !question.required && isEmpty(value) ? (
              "Skip"
            ) : (
              <>
                <span>OK</span>
                <Check size={18} />
              </>
            )}
          </button>
          <span id={`hint-${question.id}`} className="public-key-hint">
            {keyboardHint(question)}
          </span>
        </div>
      </div>
    </motion.form>
  );
}
