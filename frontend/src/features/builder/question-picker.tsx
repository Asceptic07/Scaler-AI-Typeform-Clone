import { Modal } from "@/components/ui/modal";
import { questionTypes } from "@/features/builder/question-types";
import type { QuestionType } from "@/types/form";

export function QuestionPicker({
  onChoose,
  onClose,
  busy,
}: {
  onChoose: (type: QuestionType) => void;
  onClose: () => void;
  busy: boolean;
}) {
  return (
    <Modal
      title="What would you like to ask?"
      wide
      busy={busy}
      onClose={onClose}
    >
      <p className="modal-description">
        Choose a question type to keep the conversation flowing.
      </p>
      <div className="question-picker">
        {questionTypes.map(({ type, label, description, Icon, color }) => (
          <button key={type} disabled={busy} onClick={() => onChoose(type)}>
            <span className={`type-badge ${color}`}>
              <Icon size={18} />
            </span>
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
