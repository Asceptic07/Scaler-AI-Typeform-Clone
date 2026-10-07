import type { Question } from "@/types/form";
import type { Answers, AnswerValue } from "@/types/respondent";

export function supportsLogic(question: Question): boolean {
  return ["multiple_choice", "dropdown", "yes_no", "rating"].includes(question.type);
}

// Returns an ordered question index, or null for the existing submission flow.
export function resolveNextQuestion(
  question: Question,
  answer: AnswerValue | undefined,
  ordered: Question[],
): number | null {
  const current = ordered.findIndex((item) => item.id === question.id);
  const rule = question.logic_rules?.find((item) => {
    const condition = item.condition_option_id ??
      item.condition_boolean_value ?? item.condition_rating_value;
    return answer !== undefined && answer !== null && answer === condition;
  });
  if (rule) {
    if (rule.target_question_id === null) return null;
    const target = ordered.findIndex((item) => item.id === rule.target_question_id);
    if (target > current) return target;
  }
  return current + 1 < ordered.length ? current + 1 : null;
}

export function reachableQuestions(
  ordered: Question[], answers: Answers,
): Question[] {
  const path: Question[] = [];
  let index: number | null = ordered.length ? 0 : null;
  while (index !== null) {
    const question = ordered[index];
    path.push(question);
    index = resolveNextQuestion(question, answers[question.id], ordered);
  }
  return path;
}

export function pruneFutureAnswers(
  ordered: Question[], current: number, answers: Answers,
): Answers {
  const earlier = new Set(ordered.slice(0, current + 1).map((question) => question.id));
  return Object.fromEntries(
    Object.entries(answers).filter(([id]) => earlier.has(Number(id))),
  );
}
