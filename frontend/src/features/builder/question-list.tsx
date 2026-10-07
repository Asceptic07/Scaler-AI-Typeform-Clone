"use client";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { typeInfo } from "@/features/builder/question-types";
import type { Question } from "@/types/form";

function QuestionRow({
  question,
  selected,
  locked,
  onSelect,
  onDelete,
}: {
  question: Question;
  selected: boolean;
  locked: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled: locked });
  const { Icon, color } = typeInfo(question.type);
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`question-row ${selected ? "selected" : ""} ${isDragging ? "dragging" : ""}`}
    >
      <button
        className="drag-handle"
        aria-label={`Reorder question ${question.position + 1}`}
        disabled={locked}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <button
        className="question-select"
        aria-current={selected ? "true" : undefined}
        onClick={onSelect}
      >
        <span className={`type-badge ${color}`}>
          <Icon size={13} />
          <span>{question.position + 1}</span>
        </span>
        <span className="question-row-title">
          {question.title || "Untitled question"}
          {question.required ? " *" : ""}
        </span>
      </button>
      <button
        className="question-delete icon-button"
        disabled={locked}
        aria-label={`Delete question ${question.position + 1}`}
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

export function QuestionList({
  questions,
  selectedId,
  locked,
  onSelect,
  onDelete,
  onReorder,
}: {
  questions: Question[];
  selectedId?: number;
  locked: boolean;
  onSelect: (question: Question) => void;
  onDelete: (question: Question) => void;
  onReorder: (active: number, over: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function dragEnd(event: DragEndEvent) {
    if (event.over && event.active.id !== event.over.id)
      onReorder(Number(event.active.id), Number(event.over.id));
  }
  return (
    <aside className="question-rail">
      <section className="rail-pages" aria-label="Form pages">
        <div className="question-rail-heading">
          <span>Pages</span>
          <span>{questions.length}</span>
        </div>
        <DndContext
          id="builder-questions"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={dragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="question-list" aria-label="Questions">
              {questions.map((question) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  selected={question.id === selectedId}
                  locked={locked}
                  onSelect={() => onSelect(question)}
                  onDelete={() => onDelete(question)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      </section>
    </aside>
  );
}
