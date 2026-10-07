import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnswerVisual } from "@/features/builder/answer-visual";
import { isChoice } from "@/features/builder/question-types";
import type { Question } from "@/types/form";

export function QuestionEditor({
  question,
  locked,
  busy,
  error,
  onChange,
  onSave,
}: {
  question: Question;
  locked: boolean;
  busy: boolean;
  error: string;
  onChange: (question: Question) => void;
  onSave: () => void;
}) {
  return (
    <div className="editor-surface">
      <div className="editor-question">
        <span className="question-number">
          {question.position + 1} <ArrowRight size={15} />
        </span>
        <div className="editor-content">
          <textarea
            className="editable-title"
            aria-label="Question title"
            value={question.title}
            maxLength={500}
            rows={2}
            readOnly={locked}
            disabled={busy}
            onChange={(event) =>
              onChange({ ...question, title: event.target.value })
            }
            onBlur={onSave}
            placeholder="Your question here"
          />
          <textarea
            className="editable-description"
            aria-label="Question description"
            value={question.description ?? ""}
            maxLength={5000}
            rows={2}
            readOnly={locked}
            disabled={busy}
            onChange={(event) =>
              onChange({ ...question, description: event.target.value || null })
            }
            onBlur={onSave}
            placeholder="Description (optional)"
          />
          {isChoice(question.type) && !locked ? (
            <div className="option-editor">
              {question.options.map((option, index) => (
                <div key={option.id} className="option-edit-row">
                  <span className="choice-key">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <input
                    aria-label={`Option ${index + 1}`}
                    value={option.label}
                    maxLength={500}
                    disabled={busy}
                    onChange={(event) =>
                      onChange({
                        ...question,
                        options: question.options.map((item, i) =>
                          i === index
                            ? { ...item, label: event.target.value }
                            : item,
                        ),
                      })
                    }
                    onBlur={onSave}
                  />
                  <button
                    className="icon-button"
                    disabled={busy || question.options.length <= 1}
                    aria-label={`Delete option ${index + 1}`}
                    onClick={() => {
                      onChange({
                        ...question,
                        options: question.options
                          .filter((_, i) => i !== index)
                          .map((item, i) => ({ ...item, position: i })),
                      });
                      onSave();
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <Button
                variant="ghost"
                className="add-choice"
                disabled={busy || question.options.length >= 100}
                onClick={() => {
                  let count = question.options.length + 1;
                  while (
                    question.options.some(
                      (option) => option.label === `Choice ${count}`,
                    )
                  )
                    count++;
                  onChange({
                    ...question,
                    options: [
                      ...question.options,
                      {
                        id: -Date.now(),
                        label: `Choice ${count}`,
                        position: question.options.length,
                      },
                    ],
                  });
                  onSave();
                }}
              >
                <Plus size={15} />
                Add choice
              </Button>
            </div>
          ) : (
            <AnswerVisual
              key={`${question.id}-${question.type}`}
              question={question}
            />
          )}
          {question.type === "dropdown" && !locked && (
            <div className="dropdown-editor-preview">
              <span className="hint">Dropdown preview</span>
              <AnswerVisual key={question.id} question={question} />
            </div>
          )}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          <div className="canvas-continue">
            <span className="preview-ok">
              OK <span>✓</span>
            </span>
            <span>
              press <strong>Enter ↵</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
