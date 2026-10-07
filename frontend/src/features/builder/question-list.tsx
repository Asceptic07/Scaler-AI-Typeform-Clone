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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onAdd,
  onReorder,
}: {
  questions: Question[];
  selectedId?: number;
  locked: boolean;
  onSelect: (question: Question) => void;
  onDelete: (question: Question) => void;
  onAdd: () => void;
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
      <div className="question-rail-heading">
        <span>Content</span>
        <span>{questions.length}</span>
      </div>
      <Button
        variant="secondary"
        className="add-content"
        disabled={locked}
        onClick={onAdd}
      >
        <Plus size={16} />
        Add question
      </Button>
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
          <ol className="question-list">
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
      {questions.length === 0 && (
        <p className="rail-empty">
          Your questions will appear here.
          <br />
          Add your first one to get started.
        </p>
      )}
      <div className="rail-footer">
        {locked
          ? "Questions are read-only"
          : "Drag to reorder · Changes save automatically"}
      </div>
    </aside>
  );
}
