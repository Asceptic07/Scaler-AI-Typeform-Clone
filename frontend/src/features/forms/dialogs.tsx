"use client";

import { useState } from "react";
import { Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { errorMessage } from "@/lib/api/client";
import { getShareUrl } from "@/lib/share";
import type { FormSummary } from "@/types/form";

export function TitleDialog({
  initial = "",
  mode,
  onClose,
  onSubmit,
}: {
  initial?: string;
  mode: "create" | "rename";
  onClose: () => void;
  onSubmit: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal
      title={mode === "create" ? "Let’s create your form" : "Rename your form"}
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!title.trim()) {
            setError("Give your form a name to continue.");
            return;
          }
          setBusy(true);
          setError("");
          try {
            await onSubmit(title.trim());
          } catch (error) {
            setError(errorMessage(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="modal-description">
          {mode === "create"
            ? "Every great conversation starts with a question. Give yours a name."
            : "Choose a name that’s easy to find in your workspace."}
        </p>
        <label className="field-label" htmlFor="form-title">
          Form name
        </label>
        <input
          id="form-title"
          data-autofocus
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Customer feedback"
          maxLength={200}
          required
          disabled={busy}
          aria-describedby={error ? "title-error" : undefined}
        />
        {error && (
          <p id="title-error" className="field-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !title.trim()}>
            {busy ? "Saving…" : mode === "create" ? "Create form" : "Save name"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirm = "Delete",
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  confirm?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <p className="modal-description">{description}</p>
      <div className="modal-actions">
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
            } catch (error) {
              toast.error(errorMessage(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Deleting…" : confirm}
        </Button>
      </div>
    </Modal>
  );
}

export async function copyShareLink(slug: string) {
  try {
    await navigator.clipboard.writeText(getShareUrl(slug));
    toast.success("Link copied");
  } catch {
    toast.error(
      "Couldn’t copy the link. You can select it in the Share dialog.",
    );
  }
}

export function ShareDialog({
  form,
  onClose,
}: {
  form: FormSummary;
  onClose: () => void;
}) {
  return (
    <Modal title="Your form is published" onClose={onClose}>
      <div className="share-emblem">
        <Link2 size={30} />
      </div>
      <p className="modal-description">
        A link for <strong>{form.title}</strong>, ready for your next
        conversation.
      </p>
      <label className="field-label" htmlFor="share-url">
        Form link
      </label>
      <div className="share-input">
        <input
          id="share-url"
          className="input"
          readOnly
          value={form.public_slug ? getShareUrl(form.public_slug) : ""}
          onFocus={(event) => event.target.select()}
        />
        <Button
          aria-label="Copy share link"
          onClick={() =>
            form.public_slug && void copyShareLink(form.public_slug)
          }
        >
          <Copy size={17} />
          Copy
        </Button>
      </div>
      <p className="hint">
        Public form filling will be available in the next phase.
      </p>
      <div className="modal-actions">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
