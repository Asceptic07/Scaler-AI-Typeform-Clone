"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronDown,
  Copy,
  Eye,
  FileText,
  Link2,
  Loader2,
  LockKeyhole,
  Monitor,
  Plus,
  Send,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import { Status } from "@/components/ui/status";
import { Preview } from "@/features/builder/preview";
import { QuestionEditor } from "@/features/builder/question-editor";
import { QuestionList } from "@/features/builder/question-list";
import { QuestionPicker } from "@/features/builder/question-picker";
import { QuestionSettings } from "@/features/builder/question-settings";
import { isChoice } from "@/features/builder/question-types";
import {
  ConfirmDialog,
  ShareDialog,
  TitleDialog,
} from "@/features/forms/dialogs";
import { ApiError, errorMessage } from "@/lib/api/client";
import { formsApi } from "@/lib/api/forms";
import { questionsApi } from "@/lib/api/questions";
import type { Form, Question, QuestionInput, QuestionType } from "@/types/form";

function payload(question: Question): QuestionInput {
  return {
    type: question.type,
    title: question.title.trim(),
    description: question.description,
    required: question.required,
    options: question.options.map((option) => ({ label: option.label.trim() })),
  };
}
function changed(question: Question | null, form: Form | null) {
  const saved = form?.questions.find((item) => item.id === question?.id);
  return (
    !!question &&
    !!saved &&
    JSON.stringify(payload(question)) !== JSON.stringify(payload(saved))
  );
}

export function Builder({ formId }: { formId: number }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const formRef = useRef<Form | null>(null);
  const [draft, setDraft] = useState<Question | null>(null);
  const draftRef = useRef<Question | null>(null);
  const [error, setError] = useState<number | null>(null);
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const pending = useRef<Promise<boolean> | null>(null);
  const [saveError, setSaveError] = useState("");
  const [dialog, setDialog] = useState<
    "add" | "rename" | "share" | "preview" | null
  >(null);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const [mobileCanvas, setMobileCanvas] = useState(false);
  function acceptForm(next: Form) {
    formRef.current = next;
    setForm(next);
  }
  function acceptDraft(next: Question | null) {
    draftRef.current = next;
    setDraft(next);
  }
  useEffect(() => {
    const controller = new AbortController();
    formsApi
      .get(formId, controller.signal)
      .then((value) => {
        formRef.current = value;
        setForm(value);
        draftRef.current = value.questions[0] ?? null;
        setDraft(value.questions[0] ?? null);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(error instanceof ApiError ? error.status : 0);
      });
    return () => controller.abort();
  }, [formId, reload]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (pending.current || changed(draftRef.current, formRef.current))
        event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);
  async function saveCurrent(): Promise<boolean> {
    if (pending.current) {
      if (!(await pending.current)) return false;
      return saveCurrent();
    }
    const question = draftRef.current;
    const currentForm = formRef.current;
    if (!question || !currentForm || !changed(question, currentForm))
      return true;
    const data = payload(question);
    if (
      !data.title ||
      data.options?.some((option) => !option.label) ||
      new Set(data.options?.map((option) => option.label)).size !==
        data.options?.length
    ) {
      setSaveError(
        "Add a question title and unique, non-empty choices before continuing.",
      );
      return false;
    }
    setSaving(true);
    setSaveError("");
    const saving = (async () => {
      try {
        const updated = await questionsApi.update(
          currentForm.id,
          question.id,
          data,
        );
        acceptForm({
          ...currentForm,
          questions: currentForm.questions.map((item) =>
            item.id === updated.id ? updated : item,
          ),
        });
        if (
          draftRef.current?.id === question.id &&
          JSON.stringify(payload(draftRef.current)) === JSON.stringify(data)
        )
          acceptDraft(updated);
        return true;
      } catch (error) {
        const message = errorMessage(error);
        setSaveError(message);
        toast.error(message);
        if (error instanceof ApiError && error.status === 409) {
          try {
            const refreshed = await formsApi.get(currentForm.id);
            acceptForm(refreshed);
            acceptDraft(
              refreshed.questions.find((item) => item.id === question.id) ??
                null,
            );
          } catch {
            /* Keep the last known form visible. */
          }
        }
        return false;
      } finally {
        setSaving(false);
        pending.current = null;
      }
    })();
    pending.current = saving;
    return saving;
  }
  async function selectQuestion(question: Question) {
    if (await saveCurrent()) {
      acceptDraft(
        formRef.current?.questions.find((item) => item.id === question.id) ??
          question,
      );
      setSaveError("");
    }
  }
  async function addQuestion(type: QuestionType) {
    if (!(await saveCurrent())) {
      setDialog(null);
      return;
    }
    setBusy(true);
    try {
      const question = await questionsApi.create(formId, {
        type,
        title: "Your question here",
        options: isChoice(type)
          ? [{ label: "Choice 1" }, { label: "Choice 2" }]
          : [],
      });
      acceptForm(await formsApi.get(formId));
      acceptDraft(question);
      setDialog(null);
      toast.success("Question added");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function reorder(active: number, over: number) {
    if (!(await saveCurrent())) return;
    const previous = formRef.current;
    if (!previous) return;
    const from = previous.questions.findIndex(
      (question) => question.id === active,
    );
    const to = previous.questions.findIndex((question) => question.id === over);
    if (from < 0 || to < 0) return;
    const questions = arrayMove(previous.questions, from, to).map(
      (question, position) => ({ ...question, position }),
    );
    acceptForm({ ...previous, questions });
    setBusy(true);
    try {
      const result = await questionsApi.reorder(
        formId,
        questions.map((question) => question.id),
      );
      acceptForm(result);
      acceptDraft(
        result.questions.find(
          (question) => question.id === draftRef.current?.id,
        ) ?? null,
      );
    } catch (error) {
      acceptForm(previous);
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function publication() {
    if (!(await saveCurrent())) return;
    const current = formRef.current;
    if (!current) return;
    setBusy(true);
    try {
      const result = await (current.status === "published"
        ? formsApi.unpublish(formId)
        : formsApi.publish(formId));
      acceptForm(result);
      acceptDraft(
        result.questions.find(
          (question) => question.id === draftRef.current?.id,
        ) ?? null,
      );
      toast.success(
        result.status === "published" ? "Form published" : "Form unpublished",
      );
      if (result.status === "published") setDialog("share");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function duplicate() {
    if (!(await saveCurrent())) return;
    setBusy(true);
    try {
      const result = await formsApi.duplicate(formId);
      toast.success("Draft copy created");
      router.push(`/forms/${result.id}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  if (error !== null)
    return (
      <div className="builder-error">
        <Link href="/" className="back-link">
          <ArrowLeft size={17} />
          My workspace
        </Link>
        <ErrorState
          notFound={error === 404}
          retry={() => {
            if (error === 404) router.push("/");
            else {
              setError(null);
              setReload((value) => value + 1);
            }
          }}
        />
      </div>
    );
  if (!form)
    return (
      <div className="builder-loading">
        <Skeleton builder />
      </div>
    );
  const locked = form.status === "published" || form.response_count > 0;
  const workingForm = {
    ...form,
    questions: form.questions.map((question) =>
      question.id === draft?.id
        ? { ...draft, position: question.position }
        : question,
    ),
  };
  const dirty = changed(draft, form);
  return (
    <div className="builder-app">
      <header className="builder-header">
        <div className="builder-identity">
          <Link
            href="/"
            className="icon-button"
            aria-label="Back to workspace"
            onClick={async (event) => {
              event.preventDefault();
              if (await saveCurrent()) router.push("/");
            }}
          >
            <ArrowLeft size={19} />
          </Link>
          <span className="builder-divider" />
          <button
            className="builder-title"
            disabled={busy}
            onClick={() => setDialog("rename")}
          >
            {form.title}
            <ChevronDown size={14} />
          </button>
          <Status status={form.status} />
        </div>
        <div className="builder-top-actions">
          <span
            className={`save-status ${saveError ? "danger-text" : ""}`}
            role="status"
          >
            {busy || saving ? (
              <>
                <Loader2 size={13} className="spin" />
                Saving…
              </>
            ) : saveError ? (
              <button onClick={() => void saveCurrent()}>
                Not saved · Retry
              </button>
            ) : dirty ? (
              "Unsaved changes"
            ) : (
              <>
                <Check size={13} />
                All changes saved
              </>
            )}
          </span>
          <Button variant="secondary" onClick={() => setDialog("preview")}>
            <Eye size={16} />
            Preview
          </Button>
          {form.status === "published" && (
            <Button variant="secondary" onClick={() => setDialog("share")}>
              <Link2 size={16} />
              Share
            </Button>
          )}
          <Button disabled={busy} onClick={() => void publication()}>
            {form.status === "published" ? (
              "Unpublish"
            ) : (
              <>
                <Send size={15} />
                Publish
              </>
            )}
          </Button>
        </div>
      </header>
      <div className="builder-subnav">
        <span className="builder-content-tab">
          <FileText size={15} />
          Content
        </span>
        <Link
          className="builder-nav-link"
          href={`/forms/${form.id}/results`}
          onClick={async (event) => {
            event.preventDefault();
            if (await saveCurrent()) router.push(`/forms/${form.id}/results`);
          }}
        >
          <BarChart3 size={15} />
          Results
        </Link>
        <span className="builder-subnav-hint">
          Build a conversation, one question at a time.
        </span>
      </div>
      {locked && (
        <div className="lock-banner">
          <LockKeyhole size={16} />
          <span>
            {form.response_count > 0
              ? "This form has submitted responses. Duplicate it to edit questions without changing past answers."
              : "This form is live. Unpublish it to edit your questions."}
          </span>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              void (form.response_count > 0 ? duplicate() : publication())
            }
          >
            {form.response_count > 0 ? (
              <>
                <Copy size={14} />
                Duplicate to edit
              </>
            ) : (
              "Unpublish to edit"
            )}
          </Button>
        </div>
      )}
      <div className="builder-body">
        <QuestionList
          questions={workingForm.questions}
          selectedId={draft?.id}
          locked={locked || busy}
          onSelect={(question) => void selectQuestion(question)}
          onDelete={setDeleting}
          onAdd={() => setDialog("add")}
          onReorder={(active, over) => void reorder(active, over)}
        />
        <main className="builder-canvas">
          <div className="canvas-toolbar">
            <span>
              {draft
                ? `Question ${draft.position + 1} of ${form.questions.length}`
                : "Your blank canvas"}
            </span>
            <div className="segmented">
              <button
                aria-label="Desktop canvas"
                aria-pressed={!mobileCanvas}
                onClick={() => setMobileCanvas(false)}
              >
                <Monitor size={16} />
              </button>
              <button
                aria-label="Mobile canvas"
                aria-pressed={mobileCanvas}
                onClick={() => setMobileCanvas(true)}
              >
                <Smartphone size={16} />
              </button>
            </div>
          </div>
          <div
            className={`canvas-frame ${mobileCanvas ? "canvas-mobile" : ""}`}
          >
            {draft ? (
              <QuestionEditor
                question={draft}
                locked={locked}
                busy={busy}
                error={saveError}
                onChange={(question) => {
                  acceptDraft(question);
                  setSaveError("");
                }}
                onSave={() => {
                  if (!locked) void saveCurrent();
                }}
              />
            ) : (
              <div className="builder-empty">
                <div className="empty-illustration">
                  <FileText size={42} strokeWidth={1.2} />
                  <span>?</span>
                </div>
                <h1>Start with a good question.</h1>
                <p>
                  A name, an opinion, a little feedback.
                  <br />
                  What would you like to know?
                </p>
                <Button
                  disabled={locked || busy}
                  onClick={() => setDialog("add")}
                >
                  <Plus size={17} />
                  Add your first question
                </Button>
              </div>
            )}
          </div>
          <div className="canvas-footer">
            <span>Make it feel like a conversation.</span>
            <span>
              {locked ? "Read-only" : "Click on the question to edit"}
            </span>
          </div>
        </main>
        {draft ? (
          <QuestionSettings
            question={draft}
            locked={locked}
            busy={busy}
            onChange={acceptDraft}
            onSave={() => void saveCurrent()}
            onDelete={() => setDeleting(draft)}
          />
        ) : (
          <aside className="question-settings empty-settings">
            <h3>Make it yours</h3>
            <p>Select a question to see its settings here.</p>
          </aside>
        )}
      </div>
      {dialog === "add" && (
        <QuestionPicker
          busy={busy}
          onChoose={(type) => void addQuestion(type)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "rename" && (
        <TitleDialog
          mode="rename"
          initial={form.title}
          onClose={() => setDialog(null)}
          onSubmit={async (title) => {
            if (!(await saveCurrent()))
              throw new ApiError(
                422,
                "Save or correct your question before renaming the form.",
              );
            acceptForm(await formsApi.rename(formId, title));
            setDialog(null);
            toast.success("Form renamed");
          }}
        />
      )}
      {dialog === "share" && (
        <ShareDialog form={form} onClose={() => setDialog(null)} />
      )}
      {dialog === "preview" && (
        <Preview
          form={workingForm}
          initialId={draft?.id}
          onClose={() => setDialog(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this question?"
          description={`“${deleting.title}” will be removed from your form.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            setBusy(true);
            try {
              if (pending.current) await pending.current;
              await questionsApi.remove(formId, deleting.id);
              const next = await formsApi.get(formId);
              acceptForm(next);
              if (draftRef.current?.id === deleting.id)
                acceptDraft(
                  next.questions[
                    Math.min(deleting.position, next.questions.length - 1)
                  ] ?? null,
                );
              else if (draftRef.current) {
                const active = next.questions.find(
                  (question) => question.id === draftRef.current?.id,
                );
                if (active)
                  acceptDraft({
                    ...draftRef.current,
                    position: active.position,
                  });
              }
              setDeleting(null);
              toast.success("Question deleted");
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}
