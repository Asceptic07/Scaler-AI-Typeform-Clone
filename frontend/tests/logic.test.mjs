import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../src/lib/logic.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const context = vm.createContext({ exports: {} });
vm.runInContext(compiled, context);
const { resolveNextQuestion, reachableQuestions, pruneFutureAnswers } = context.exports;
const question = (id, rules = []) => ({ id, type: "yes_no", position: id - 1, logic_rules: rules });
const ordered = [
  question(1, [
    { condition_boolean_value: true, target_question_id: 3 },
    { condition_boolean_value: false, target_question_id: null },
  ]),
  question(2), question(3), question(4),
];
const ids = (questions) => Array.from(questions, (item) => item.id);

test("matching Yes skips forward; matching No ends; missing value falls back", () => {
  assert.equal(resolveNextQuestion(ordered[0], true, ordered), 2);
  assert.equal(resolveNextQuestion(ordered[0], false, ordered), null);
  assert.equal(resolveNextQuestion(ordered[0], undefined, ordered), 1);
});
test("choice, dropdown and rating use strict equality conditions", () => {
  for (const [type, field, value] of [
    ["multiple_choice", "condition_option_id", 10],
    ["dropdown", "condition_option_id", 11],
    ["rating", "condition_rating_value", 1],
  ]) {
    const source = { ...question(1), type, logic_rules: [{ [field]: value, target_question_id: 3 }] };
    const questions = [source, question(2), question(3)];
    assert.equal(resolveNextQuestion(source, value, questions), 2);
    assert.equal(resolveNextQuestion(source, String(value), questions), 1);
  }
});
test("no-logic forms remain sequential and end at their final question", () => {
  const questions = [question(1), question(2), question(3)];
  assert.deepEqual(ids(reachableQuestions(questions, {})), [1, 2, 3]);
  assert.equal(resolveNextQuestion(questions[2], null, questions), null);
});
test("reachable path ignores skipped questions and stale branch answers", () => {
  assert.deepEqual(ids(reachableQuestions(ordered, { 1: true, 2: "stale", 3: 4 })), [1, 3, 4]);
  assert.deepEqual(ids(reachableQuestions(ordered, { 1: false, 3: 4, 4: "old branch" })), [1]);
});
test("changing an earlier answer prunes future values while preserving zero and false", () => {
  const answers = { 1: false, 2: 0, 3: 4, 4: "old branch" };
  assert.deepEqual(JSON.parse(JSON.stringify(pruneFutureAnswers(ordered, 1, answers))), { 1: false, 2: 0 });
  assert.deepEqual(answers, { 1: false, 2: 0, 3: 4, 4: "old branch" });
});
test("malformed backward/self/foreign targets cannot create frontend loops", () => {
  for (const target_question_id of [1, 999]) {
    const source = question(1, [{ condition_boolean_value: true, target_question_id }]);
    assert.deepEqual(ids(reachableQuestions([source, question(2)], { 1: true })), [1, 2]);
  }
});
