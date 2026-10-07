import { LockKeyhole, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isChoice,
  questionTypes,
  typeInfo,
} from "@/features/builder/question-types";
import type { Question, QuestionType } from "@/types/form";

export function QuestionSettings({
  question,
  locked,
  busy,
  onChange,
  onSave,
  onDelete,
}: {
  question: Question;
  locked: boolean;
  busy: boolean;
  onChange: (question: Question) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const { Icon, color } = typeInfo(question.type);
  return (
    <aside className="question-settings">
      <div className="settings-heading">Question settings</div>
      <label className="field-label" htmlFor="question-type">
        Question type
      </label>
      <div className="type-select">
        <span className={`type-badge ${color}`}>
          <Icon size={16} />
        </span>
        <select
          id="question-type"
          value={question.type}
          disabled={locked || busy}
          onChange={(event) => {
            const type = event.target.value as QuestionType;
            onChange({
              ...question,
              type,
              options: isChoice(type)
                ? question.options.length
                  ? question.options
                  : [
                      { id: -1, label: "Choice 1", position: 0 },
                      { id: -2, label: "Choice 2", position: 1 },
                    ]
                : [],
              rating_min: type === "rating" ? 1 : null,
              rating_max: type === "rating" ? 5 : null,
            });
            onSave();
          }}
        >
          {questionTypes.map((type) => (
            <option key={type.type} value={type.type}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-rule">
        <div>
          <strong>Required</strong>
          <p>Make sure this gets an answer.</p>
        </div>
        <button
          className="switch"
          type="button"
          role="switch"
          aria-label="Required question"
          aria-checked={question.required}
          disabled={locked || busy}
          onClick={() => {
            onChange({ ...question, required: !question.required });
            onSave();
          }}
        >
          <span />
        </button>
      </div>
      <div className="settings-detail">
        <span>Answer</span>
        <strong>
          {question.type === "rating"
            ? "5-point rating"
            : isChoice(question.type) || question.type === "yes_no"
              ? "Single selection"
              : question.type === "email"
                ? "Email address"
                : question.type === "number"
                  ? "Numeric value"
                  : "Free text"}
        </strong>
        <p>
          {question.type === "rating"
            ? "A fixed scale from 1 to 5."
            : isChoice(question.type)
              ? "Edit your choices directly on the canvas."
              : "A simple, focused space for their answer."}
        </p>
      </div>
      <div className="settings-tip">
        A good question is clear, concise, and asks one thing at a time.
      </div>
      <div className="settings-bottom">
        {locked && (
          <p className="locked-note">
            <LockKeyhole size={14} />
            Editing is protected for this form.
          </p>
        )}
        <Button
          variant="ghost"
          className="danger-text"
          disabled={locked || busy}
          onClick={onDelete}
        >
          <Trash2 size={15} />
          Delete question
        </Button>
      </div>
    </aside>
  );
}
