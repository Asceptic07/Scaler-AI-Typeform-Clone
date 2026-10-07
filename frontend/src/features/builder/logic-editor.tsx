"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ApiError, errorMessage } from "@/lib/api/client";
import type { LogicRuleInput, Question } from "@/types/form";

export function LogicEditor({ question, questions, onSave, onClose }: {
  question: Question;
  questions: Question[];
  onSave: (rules: LogicRuleInput[]) => Promise<void>;
  onClose: () => void;
}) {
  const [rules, setRules] = useState<LogicRuleInput[]>(() => question.logic_rules.map(
    ({ condition_option_id, condition_boolean_value, condition_rating_value, target_question_id }) =>
      ({ condition_option_id, condition_boolean_value, condition_rating_value, target_question_id }),
  ));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const choices = question.type === "yes_no"
    ? [{ value: true, label: "Yes" }, { value: false, label: "No" }]
    : question.type === "rating"
      ? [1, 2, 3, 4, 5].map((value) => ({ value, label: String(value) }))
      : question.options.map((option) => ({ value: option.id, label: option.label }));
  const key = question.type === "yes_no" ? "condition_boolean_value"
    : question.type === "rating" ? "condition_rating_value" : "condition_option_id";
  const used = rules.map((rule) => String(rule[key]));
  const nextChoice = choices.find((choice) => !used.includes(String(choice.value)));
  function condition(value: boolean | number, target: number | null): LogicRuleInput {
    return { [key]: value, target_question_id: target };
  }
  return (
    <Modal title="Question logic" busy={busy} onClose={onClose}>
      <p className="modal-description">Match an answer to skip forward or end the form.</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onSave(rules);
          } catch (error) {
            setError(
              error instanceof ApiError && typeof error.details === "string"
                ? error.details : errorMessage(error),
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="logic-rules">
          {rules.map((rule, index) => (
            <div className="logic-rule" key={index}>
              <label className="field-label">If answer is
                <select className="input" disabled={busy} value={String(rule[key])}
                  onChange={(event) => {
                    const value = choices.find((choice) => String(choice.value) === event.target.value)!.value;
                    setRules(rules.map((item, i) => i === index ? condition(value, item.target_question_id) : item));
                  }}>
                  {choices.map((choice) => <option key={String(choice.value)} value={String(choice.value)}
                    disabled={used.includes(String(choice.value)) && String(rule[key]) !== String(choice.value)}>
                    {choice.label}
                  </option>)}
                </select>
              </label>
              <label className="field-label">Then jump to
                <select className="input" disabled={busy} value={rule.target_question_id ?? "end"}
                  onChange={(event) => setRules(rules.map((item, i) => i === index
                    ? { ...item, target_question_id: event.target.value === "end" ? null : Number(event.target.value) } : item))}>
                  <option value="end">End form</option>
                  {questions.filter((item) => item.position > question.position).map((item) =>
                    <option key={item.id} value={item.id}>{item.position + 1}. {item.title}</option>)}
                </select>
              </label>
              <button type="button" className="icon-button" disabled={busy}
                aria-label={`Delete logic rule ${index + 1}`} onClick={() => setRules(rules.filter((_, i) => i !== index))}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <Button variant="secondary" disabled={busy || !nextChoice} onClick={() => {
          if (nextChoice) setRules([...rules, condition(nextChoice.value, null)]);
        }}><Plus size={15} /> Add rule</Button>
        <p className="modal-description">Otherwise: continue to the next question.</p>
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <Button variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save logic"}</Button>
        </div>
      </form>
    </Modal>
  );
}
