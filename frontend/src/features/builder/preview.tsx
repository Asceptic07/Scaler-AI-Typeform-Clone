"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AnswerVisual } from "@/features/builder/answer-visual";
import type { Form } from "@/types/form";

export function Preview({
  form,
  initialId,
  onClose,
}: {
  form: Form;
  initialId?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(
    Math.max(
      0,
      form.questions.findIndex((q) => q.id === initialId),
    ),
  );
  const [mobile, setMobile] = useState(false);
  const question = form.questions[index];
  return (
    <Modal title="Preview your form" wide onClose={onClose}>
      <div className="preview-toolbar">
        <span>{form.title}</span>
        <div className="segmented">
          <button
            aria-label="Desktop preview"
            aria-pressed={!mobile}
            onClick={() => setMobile(false)}
          >
            <Monitor size={17} />
          </button>
          <button
            aria-label="Mobile preview"
            aria-pressed={mobile}
            onClick={() => setMobile(true)}
          >
            <Smartphone size={17} />
          </button>
        </div>
      </div>
      <div className={`preview-screen ${mobile ? "preview-mobile" : ""}`}>
        {question ? (
          <div className="respondent-question">
            <span className="question-number">{index + 1} →</span>
            <div>
              <h3>
                {question.title}
                {question.required && <span aria-label="required"> *</span>}
              </h3>
              {question.description && (
                <p className="question-description">{question.description}</p>
              )}
              <AnswerVisual key={question.id} question={question} interactive />
            </div>
          </div>
        ) : (
          <div className="feedback-state">
            <h3>A blank canvas</h3>
            <p>Add a question to see your form come to life.</p>
          </div>
        )}
      </div>
      {form.questions.length > 0 && (
        <div
          className="preview-progress"
          role="progressbar"
          aria-label="Preview question progress"
          aria-valuemin={0}
          aria-valuenow={index + 1}
          aria-valuemax={form.questions.length}
        >
          <span
            style={{ width: `${((index + 1) / form.questions.length) * 100}%` }}
          />
        </div>
      )}
      <div className="preview-navigation">
        <span>Preview only · No answers are submitted</span>
        <div>
          <Button
            variant="secondary"
            aria-label="Previous preview question"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            <ArrowLeft size={16} />
          </Button>
          <span>
            {question ? index + 1 : 0} / {form.questions.length}
          </span>
          <Button
            variant="secondary"
            aria-label="Next preview question"
            disabled={index >= form.questions.length - 1}
            onClick={() => setIndex(index + 1)}
          >
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
