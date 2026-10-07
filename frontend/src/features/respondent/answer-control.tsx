"use client";

import { Check, ChevronDown, Star } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";
import type { Question } from "@/types/form";
import type { AnswerValue } from "@/types/respondent";

export function AnswerControl({
  question,
  value,
  error,
  disabled,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  error: string | undefined;
  disabled: boolean;
  onChange: (value: AnswerValue) => void;
}) {
  const choiceGroup = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const group = choiceGroup.current;
    if (group?.contains(document.activeElement)) {
      group
        .querySelector<HTMLButtonElement>('[aria-checked="true"]')
        ?.focus({ preventScroll: true });
    }
  }, [value]);
  const id = `answer-${question.id}`;
  const labelledBy = `question-${question.id}`;
  const describedBy = [
    question.description && `description-${question.id}`,
    `hint-${question.id}`,
    error && `error-${question.id}`,
  ]
    .filter(Boolean)
    .join(" ");
  const common = {
    id,
    "aria-labelledby": labelledBy,
    "aria-describedby": describedBy,
    "aria-invalid": !!error,
    "aria-required": question.required,
    disabled,
    "data-primary": true,
  };
  if (["short_text", "long_text", "email", "number"].includes(question.type)) {
    const text = typeof value === "string" ? value : "";
    if (question.type === "long_text")
      return (
        <textarea
          {...common}
          className="answer-input public-textarea"
          rows={3}
          value={text}
          placeholder="Type your answer here…"
          onChange={(event) => onChange(event.target.value)}
        />
      );
    return (
      <input
        {...common}
        className="answer-input public-input"
        type={question.type === "email" ? "email" : "text"}
        inputMode={
          question.type === "number"
            ? "decimal"
            : question.type === "email"
              ? "email"
              : "text"
        }
        autoComplete={question.type === "email" ? "email" : "off"}
        value={text}
        placeholder={
          question.type === "email"
            ? "name@example.com"
            : question.type === "number"
              ? "Type a number here…"
              : "Type your answer here…"
        }
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  if (question.type === "dropdown")
    return (
      <div className="answer-dropdown public-dropdown">
        <select
          {...common}
          value={typeof value === "number" ? String(value) : ""}
          onChange={(event) =>
            onChange(
              event.target.value === "" ? null : Number(event.target.value),
            )
          }
        >
          <option value="">Select an option</option>
          {question.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={24} />
      </div>
    );
  const options =
    question.type === "yes_no"
      ? [
          { value: true, label: "Yes", shortcut: "Y" },
          { value: false, label: "No", shortcut: "N" },
        ]
      : question.type === "rating"
        ? [1, 2, 3, 4, 5].map((rating) => ({
            value: rating,
            label: `${rating} out of 5`,
            shortcut: String(rating),
          }))
        : question.options.map((option, index) => ({
            value: option.id,
            label: option.label,
            shortcut:
              index < 26 ? String.fromCharCode(65 + index) : String(index + 1),
          }));
  const selected = options.findIndex((option) => option.value === value);
  function arrowSelect(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.shiftKey ||
      !["ArrowLeft", "ArrowRight"].includes(event.key)
    )
      return;
    event.preventDefault();
    const next =
      (index + (event.key === "ArrowRight" ? 1 : -1) + options.length) %
      options.length;
    onChange(options[next].value);
    event.currentTarget
      .closest('[role="radiogroup"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [next]?.focus({ preventScroll: true });
  }
  return (
    <div
      role="radiogroup"
      ref={choiceGroup}
      aria-orientation="horizontal"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-required={question.required}
      aria-invalid={!!error}
      className={
        question.type === "rating"
          ? "answer-rating public-rating"
          : "answer-choices public-choices"
      }
    >
      {options.map((option, index) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          aria-label={option.label}
          tabIndex={index === (selected >= 0 ? selected : 0) ? 0 : -1}
          data-primary={
            index === (selected >= 0 ? selected : 0) ? true : undefined
          }
          disabled={disabled}
          className={
            question.type === "rating"
              ? typeof value === "number" && Number(option.value) <= value
                ? "chosen"
                : ""
              : `answer-choice ${option.value === value ? "chosen" : ""}`
          }
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => arrowSelect(event, index)}
        >
          {question.type === "rating" ? (
            <>
              <Star
                size={42}
                strokeWidth={1.5}
                fill={
                  typeof value === "number" && Number(option.value) <= value
                    ? "currentColor"
                    : "none"
                }
              />
              <span>{option.shortcut}</span>
            </>
          ) : (
            <>
              <span className="choice-key" aria-hidden="true">{option.shortcut}</span>
              <span className="public-choice-label">{option.label}</span>
              {option.value === value && <Check size={20} aria-hidden="true" />}
            </>
          )}
        </button>
      ))}
    </div>
  );
}
