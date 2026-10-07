"use client";
import { useState } from "react";
import { Check, ChevronDown, Star } from "lucide-react";
import type { Question } from "@/types/form";

export function AnswerVisual({
  question,
  interactive = false,
}: {
  question: Question;
  interactive?: boolean;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  if (question.type === "multiple_choice" || question.type === "yes_no") {
    const options =
      question.type === "yes_no"
        ? [
            { id: 1, label: "Yes" },
            { id: 0, label: "No" },
          ]
        : question.options;
    return (
      <div className="answer-choices">
        {options.map((option, i) => (
          <button
            key={option.id}
            type="button"
            className={`answer-choice ${choice === option.id ? "chosen" : ""}`}
            disabled={!interactive}
            aria-pressed={choice === option.id}
            onClick={() => setChoice(option.id)}
          >
            <span className="choice-key">{String.fromCharCode(65 + i)}</span>
            {option.label}
            {choice === option.id && <Check size={18} />}
          </button>
        ))}
      </div>
    );
  }
  if (question.type === "dropdown")
    return (
      <div className="answer-dropdown">
        <select
          aria-label="Preview answer"
          disabled={!interactive}
          defaultValue=""
        >
          <option value="" disabled>
            Select an option
          </option>
          {question.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={20} />
      </div>
    );
  if (question.type === "rating")
    return (
      <div className="answer-rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            type="button"
            key={value}
            disabled={!interactive}
            aria-label={`Rate ${value} out of 5`}
            aria-pressed={choice === value}
            className={choice !== null && value <= choice ? "chosen" : ""}
            onClick={() => setChoice(value)}
          >
            <Star
              size={32}
              fill={
                choice !== null && value <= choice ? "currentColor" : "none"
              }
              strokeWidth={1.5}
            />
            <span>{value}</span>
          </button>
        ))}
      </div>
    );
  if (question.type === "long_text")
    return (
      <textarea
        className="answer-input answer-long"
        aria-label="Preview answer"
        placeholder="Type your answer here…"
        readOnly={!interactive}
        rows={3}
      />
    );
  return (
    <input
      className="answer-input"
      aria-label="Preview answer"
      type={
        question.type === "email"
          ? "email"
          : question.type === "number"
            ? "number"
            : "text"
      }
      placeholder={
        question.type === "email"
          ? "name@example.com"
          : question.type === "number"
            ? "Type a number here…"
            : "Type your answer here…"
      }
      readOnly={!interactive}
    />
  );
}
