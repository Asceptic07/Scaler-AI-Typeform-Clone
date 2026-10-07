"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { questionTypes } from "@/features/builder/question-types";
import type { QuestionType } from "@/types/form";

const groups: { title: string; types: QuestionType[] }[] = [
  { title: "Text & contact", types: ["short_text", "long_text", "email"] },
  {
    title: "Choice",
    types: ["multiple_choice", "dropdown", "yes_no"],
  },
  { title: "Other", types: ["number"] },
  { title: "Rating & ranking", types: ["rating"] },
];

export function QuestionPicker({
  onChoose,
  onClose,
  busy,
}: {
  onChoose: (type: QuestionType) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        items: group.types
          .map((type) => questionTypes.find((item) => item.type === type)!)
          .filter((item) =>
            `${item.label} ${item.description}`.toLowerCase().includes(needle),
          ),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <Modal title="Add content" wide busy={busy} onClose={onClose}>
      <div className="content-picker">
        <label className="content-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search question types</span>
          <input
            data-autofocus
            type="search"
            aria-label="Search question types"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search question types"
          />
        </label>
        {matches.length > 0 ? (
          <div className="content-picker-groups">
            {matches.map((group) => (
              <section key={group.title} aria-label={group.title}>
                <h3>{group.title}</h3>
                <div className="content-picker-items">
                  {group.items.map(({ type, label, description, Icon, color }) => (
                    <button
                      key={type}
                      type="button"
                      disabled={busy}
                      onClick={() => onChoose(type)}
                    >
                      <span className={`content-picker-icon ${color}`}>
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="content-picker-copy">
                        <strong>{label}</strong>
                        <small>{description}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="content-picker-empty" role="status">
            <strong>No question types found</strong>
            <span>Try a different search.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
