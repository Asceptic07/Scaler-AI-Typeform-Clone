"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, FileText, Link2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/status";
import { ShareDialog } from "@/features/forms/dialogs";
import { formsApi } from "@/lib/api/forms";
import { errorMessage } from "@/lib/api/client";
import type { Form } from "@/types/form";

export function ResultsShell({
  form,
  onUpdate,
  children,
}: {
  form: Form;
  onUpdate: (form: Form) => void;
  children: ReactNode;
}) {
  const [sharing, setSharing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  async function publish() {
    if (publishing) return;
    setPublishing(true);
    try {
      onUpdate(await formsApi.publish(form.id));
      setSharing(true);
      toast.success("Form published");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPublishing(false);
    }
  }
  return (
    <div className="results-app">
      <header className="builder-header">
        <div className="builder-identity">
          <Link href="/" className="icon-button" aria-label="Back to workspace">
            <ArrowLeft size={19} />
          </Link>
          <span className="builder-divider" />
          <Link
            href={`/forms/${form.id}`}
            className="builder-title results-form-title"
            title={form.title}
          >
            {form.title}
          </Link>
          <Status status={form.status} />
        </div>
        <div className="builder-top-actions">
          {form.status === "published" ? (
            <Button variant="secondary" onClick={() => setSharing(true)}>
              <Link2 size={16} />
              Share
            </Button>
          ) : (
            <Button
              disabled={publishing || form.questions.length === 0}
              onClick={() => void publish()}
            >
              <Send size={15} />
              {publishing ? "Publishing…" : "Publish"}
            </Button>
          )}
        </div>
      </header>
      <nav className="builder-subnav" aria-label="Form navigation">
        <Link className="builder-nav-link" href={`/forms/${form.id}`}>
          <FileText size={15} />
          Content
        </Link>
        <Link
          className="builder-content-tab"
          href={`/forms/${form.id}/results`}
          aria-current="page"
        >
          <BarChart3 size={15} />
          Results
        </Link>
      </nav>
      <main className="results-main">{children}</main>
      {sharing && <ShareDialog form={form} onClose={() => setSharing(false)} />}
    </div>
  );
}
