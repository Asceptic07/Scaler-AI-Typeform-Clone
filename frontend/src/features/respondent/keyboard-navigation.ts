import type { KeyboardEvent } from "react";
import type { Question } from "@/types/form";
import type { AnswerValue } from "@/types/respondent";

export function handleQuestionKey(
  event: KeyboardEvent<HTMLElement>,
  question: Question,
  actions: {
    next: () => void;
    previous: () => void;
    choose: (value: AnswerValue) => void;
    last: boolean;
    disabled: boolean;
  },
) {
  if (
    actions.disabled ||
    event.defaultPrevented ||
    event.repeat ||
    event.nativeEvent.isComposing ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.shiftKey
  )
    return;
  const target = event.target as HTMLElement;
  if (target.tagName === "SELECT" || target.tagName === "TEXTAREA") return;
  if (
    target.closest("[data-navigation]") ||
    (target.tagName === "BUTTON" && target.getAttribute("role") !== "radio")
  )
    return;
  if (event.key === "Enter") {
    event.preventDefault();
    actions.next();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    actions.previous();
  } else if (event.key === "ArrowDown" && !actions.last) {
    event.preventDefault();
    actions.next();
  } else if (
    question.type === "multiple_choice" &&
    /^[a-z]$/i.test(event.key)
  ) {
    const option = question.options[event.key.toUpperCase().charCodeAt(0) - 65];
    if (option) {
      event.preventDefault();
      actions.choose(option.id);
    }
  } else if (question.type === "yes_no" && /^[yn]$/i.test(event.key)) {
    event.preventDefault();
    actions.choose(event.key.toLowerCase() === "y");
  } else if (question.type === "rating" && /^[1-5]$/.test(event.key)) {
    event.preventDefault();
    actions.choose(Number(event.key));
  }
}
