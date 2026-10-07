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
}: {
  question: Question;
  locked: boolean;
  busy: boolean;
  onChange: (question: Question) => void;
  onSave: () => void;
}) {
  const { Icon, color } = typeInfo(question.type);
  return (
    <aside className="question-settings">
      <div className="settings-heading">Question</div>
      <label className="field-label" htmlFor="question-type">
        Answer type
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
    </aside>
  );
}
