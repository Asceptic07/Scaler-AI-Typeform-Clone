"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import {
  getPublicForm,
  PublicApiError,
  submitPublicResponse,
} from "@/lib/api/public";
import { handleQuestionKey } from "@/features/respondent/keyboard-navigation";
import { Navigation } from "@/features/respondent/navigation";
import { Progress } from "@/features/respondent/progress";
import { PublicState } from "@/features/respondent/public-state";
import { QuestionScreen } from "@/features/respondent/question-screen";
import { ThankYou } from "@/features/respondent/thank-you";
import {
  createPayload,
  validateAnswer,
} from "@/features/respondent/validation";
import type {
  Answers,
  AnswerValue,
  PublicForm,
  ResponseReceipt,
} from "@/types/respondent";

export function RespondentForm({ slug }: { slug: string }) {
  const [form, setForm] = useState<PublicForm | null>(null);
  const [loadError, setLoadError] = useState<number | null>(null);
  const [reload, setReload] = useState(0);
  const [cursor, setCursor] = useState({ index: 0, direction: 1 });
  const indexRef = useRef(0);
  const [answers, setAnswers] = useState<Answers>({});
  const answersRef = useRef<Answers>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [submissionError, setSubmissionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submissionPending = useRef(false);
  const confirmed = useRef(false);
  const [receipt, setReceipt] = useState<ResponseReceipt | null>(null);
  const [navigating, setNavigating] = useState(false);
  const transitioning = useRef(false);
  const screen = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() === true;
  useEffect(() => {
    const controller = new AbortController();
    getPublicForm(slug, controller.signal)
      .then(setForm)
      .catch((error) => {
        if (!controller.signal.aborted)
          setLoadError(error instanceof ApiError ? error.status : 0);
      });
    return () => controller.abort();
  }, [slug, reload]);
  useEffect(() => {
    if (!form) return;
    const previous = document.title;
    document.title = `${form.title} · Typeform Clone`;
    return () => {
      document.title = previous;
    };
  }, [form]);
  function focusAnswer() {
    screen.current
      ?.querySelector<HTMLElement>("[data-primary]")
      ?.focus({ preventScroll: true });
  }
  function moveTo(index: number) {
    if (!form || index < 0 || index >= form.questions.length) return;
    if (index === indexRef.current) {
      focusAnswer();
      return;
    }
    transitioning.current = true;
    setNavigating(true);
    const direction = index > indexRef.current ? 1 : -1;
    indexRef.current = index;
    setCursor({ index, direction });
  }
  function choose(value: AnswerValue, questionId?: number) {
    if (!form || submissionPending.current) return;
    const id = form.questions[indexRef.current].id;
    // An exiting screen must never write into the next question's answer.
    if (questionId !== undefined && questionId !== id) return;
    answersRef.current = { ...answersRef.current, [id]: value };
    setAnswers(answersRef.current);
    setErrors((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
    setSubmissionError("");
  }
  function previous() {
    if (!submissionPending.current && !transitioning.current)
      moveTo(indexRef.current - 1);
  }
  async function next() {
    if (
      !form ||
      submissionPending.current ||
      transitioning.current ||
      confirmed.current
    )
      return;
    const index = indexRef.current;
    const question = form.questions[index];
    const error = validateAnswer(question, answersRef.current[question.id]);
    if (error) {
      setErrors((previous) => ({ ...previous, [question.id]: error }));
      focusAnswer();
      return;
    }
    if (index < form.questions.length - 1) {
      moveTo(index + 1);
      return;
    }
    // Recheck the whole working response before creating one atomic submission.
    const invalid = form.questions.findIndex(
      (item) => validateAnswer(item, answersRef.current[item.id]) !== null,
    );
    if (invalid >= 0) {
      const item = form.questions[invalid];
      setErrors((previous) => ({
        ...previous,
        [item.id]: validateAnswer(item, answersRef.current[item.id])!,
      }));
      moveTo(invalid);
      return;
    }
    submissionPending.current = true;
    setSubmitting(true);
    setSubmissionError("");
    try {
      const result = await submitPublicResponse(
        slug,
        createPayload(form, answersRef.current),
      );
      confirmed.current = true;
      setReceipt(result);
    } catch (error) {
      const message =
        error instanceof PublicApiError
          ? error.message
          : "Your response wasn’t confirmed. Your answers are still here. Please try again.";
      const questionId =
        error instanceof PublicApiError ? error.questionId : undefined;
      const target = form.questions.findIndex(
        (question) => question.id === questionId,
      );
      if (target >= 0 && questionId !== undefined) {
        setErrors((previous) => ({ ...previous, [questionId]: message }));
        moveTo(target);
      } else {
        setSubmissionError(message);
        focusAnswer();
      }
    } finally {
      submissionPending.current = false;
      setSubmitting(false);
    }
  }
  if (loadError !== null)
    return (
      <PublicState
        state={loadError === 404 ? "unavailable" : "network"}
        onRetry={() => {
          setLoadError(null);
          setReload((value) => value + 1);
        }}
      />
    );
  if (!form) return <PublicState state="loading" />;
  if (receipt)
    return <ThankYou title={form.title} reducedMotion={reducedMotion} />;
  if (!form.questions.length) return <PublicState state="empty" />;
  const question = form.questions[cursor.index];
  return (
    <div
      className="respondent-app"
      onKeyDown={(event) =>
        handleQuestionKey(event, question, {
          next: () => void next(),
          previous,
          choose,
          last: cursor.index === form.questions.length - 1,
          disabled: submitting || navigating,
        })
      }
    >
      <Progress
        title={form.title}
        current={cursor.index}
        total={form.questions.length}
        reducedMotion={reducedMotion}
      />
      <main ref={screen} className="public-stage">
        {submissionError && (
          <div className="public-submission-error" role="alert">
            <AlertCircle size={17} />
            <span>{submissionError}</span>
          </div>
        )}
        <AnimatePresence mode="wait" initial={false} custom={cursor.direction}>
          <QuestionScreen
            key={question.id}
            question={question}
            index={cursor.index}
            value={answers[question.id]}
            error={errors[question.id]}
            last={cursor.index === form.questions.length - 1}
            submitting={submitting}
            navigating={navigating}
            direction={cursor.direction}
            reducedMotion={reducedMotion}
            onChange={(value) => choose(value, question.id)}
            onNext={() => void next()}
            onReady={() => {
              if (indexRef.current === cursor.index) {
                transitioning.current = false;
                setNavigating(false);
              }
            }}
          />
        </AnimatePresence>
      </main>
      <Navigation
        current={cursor.index}
        total={form.questions.length}
        disabled={submitting || navigating}
        onPrevious={previous}
        onNext={() => void next()}
      />
    </div>
  );
}
