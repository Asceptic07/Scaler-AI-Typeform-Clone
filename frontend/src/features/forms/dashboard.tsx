"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  Copy,
  FileText,
  Folder,
  Home,
  LayoutGrid,
  Link2,
  List,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import { Menu } from "@/components/ui/menu";
import { Status } from "@/components/ui/status";
import {
  ConfirmDialog,
  copyShareLink,
  ShareDialog,
  TitleDialog,
} from "@/features/forms/dialogs";
import { errorMessage } from "@/lib/api/client";
import { formsApi } from "@/lib/api/forms";
import type { FormSummary } from "@/types/form";

type DialogState =
  | { type: "create" }
  | { type: "rename" | "delete" | "share"; form: FormSummary }
  | null;

export function Dashboard() {
  const router = useRouter();
  const [forms, setForms] = useState<FormSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    formsApi
      .list(controller.signal)
      .then(setForms)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [reload]);
  const displayed = useMemo(
    () =>
      (forms ?? [])
        .filter((form) =>
          form.title.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "title"
            ? a.title.localeCompare(b.title)
            : sort === "updated"
              ? b.updated_at.localeCompare(a.updated_at)
              : b.created_at.localeCompare(a.created_at) || b.id - a.id,
        ),
    [forms, search, sort],
  );
  function replace(form: FormSummary) {
    setForms(
      (previous) =>
        previous?.map((item) => (item.id === form.id ? form : item)) ?? [form],
    );
  }
  async function action(
    form: FormSummary,
    operation: "duplicate" | "publish" | "unpublish",
  ) {
    setBusyId(form.id);
    try {
      const result = await formsApi[operation](form.id);
      if (operation === "duplicate") {
        setForms((previous) => [result, ...(previous ?? [])]);
        toast.success("Form duplicated");
      } else {
        replace(result);
        toast.success(
          operation === "publish" ? "Form published" : "Form unpublished",
        );
        if (operation === "publish") setDialog({ type: "share", form: result });
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  }
  const menuItems = (form: FormSummary) => [
    {
      label: "Open form",
      icon: <ArrowUpRight size={16} />,
      onClick: () => router.push(`/forms/${form.id}`),
    },
    {
      label: "Rename",
      icon: <Pencil size={16} />,
      onClick: () => setDialog({ type: "rename", form }),
    },
    {
      label: "Duplicate",
      icon: <Copy size={16} />,
      onClick: () => void action(form, "duplicate"),
    },
    {
      label: form.status === "published" ? "Unpublish" : "Publish",
      icon:
        form.status === "published" ? <Undo2 size={16} /> : <Send size={16} />,
      onClick: () =>
        void action(
          form,
          form.status === "published" ? "unpublish" : "publish",
        ),
    },
    ...(form.status === "published" && form.public_slug
      ? [
          {
            label: "Copy share link",
            icon: <Link2 size={16} />,
            onClick: () => void copyShareLink(form.public_slug!),
          },
        ]
      : []),
    {
      label: "Delete",
      icon: <Trash2 size={16} />,
      danger: true,
      onClick: () => setDialog({ type: "delete", form }),
    },
  ];
  return (
    <div className="workspace-app">
      <header className="workspace-header">
        <Brand />
        <div className="workspace-account">
          <span>Personal workspace</span>
          <span className="avatar" aria-label="Default creator">
            SC
          </span>
        </div>
      </header>
      <nav className="workspace-tabs" aria-label="Main navigation">
        <Link href="/" className="workspace-tab">
          <Home size={17} />
          Home
        </Link>
        <Link href="/" className="workspace-tab active" aria-current="page">
          <FileText size={17} />
          Forms
        </Link>
      </nav>
      <div className="workspace-body">
        <aside className="workspace-sidebar">
          <Button
            className="create-sidebar"
            onClick={() => setDialog({ type: "create" })}
          >
            <Plus size={18} />
            Create form
          </Button>
          <div className="workspace-search">
            <Search size={17} />
            <input
              aria-label="Search forms"
              placeholder="Search forms"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <span className="sidebar-label">WORKSPACES</span>
          <a href="#workspace-content" className="workspace-folder">
            <Folder size={17} />
            My workspace<span>{forms?.length ?? "—"}</span>
          </a>
          <div className="sidebar-note">
            <div className="tiny-mark" />
            <p>
              A little curiosity.
              <br />A lot of possibilities.
            </p>
            <span>Make your next conversation count.</span>
          </div>
        </aside>
        <main id="workspace-content" className="workspace-content">
          <div className="workspace-breadcrumb">
            Your forms, all in one place
          </div>
          <div className="workspace-title-row">
            <div>
              <h1>My workspace</h1>
              <p>
                {forms
                  ? `${forms.length} form${forms.length === 1 ? "" : "s"} · Built for better conversations`
                  : "A home for your next great question"}
              </p>
            </div>
            <Button
              className="create-main"
              onClick={() => setDialog({ type: "create" })}
            >
              <Plus size={17} />
              Create form
            </Button>
          </div>
          <div className="workspace-toolbar">
            <span>{search ? `Results for “${search}”` : "All forms"}</span>
            <div className="view-controls">
              <label className="sort-control">
                <select
                  aria-label="Sort forms"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="created">Date created</option>
                  <option value="updated">Last updated</option>
                  <option value="title">Name A–Z</option>
                </select>
                <ChevronDown size={14} />
              </label>
              <div className="segmented">
                <button
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid size={17} />
                </button>
                <button
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List size={17} />
                </button>
              </div>
            </div>
          </div>
          {error ? (
            <ErrorState
              retry={() => {
                setError(false);
                setForms(null);
                setReload((value) => value + 1);
              }}
            />
          ) : !forms ? (
            <Skeleton />
          ) : forms.length === 0 ? (
            <div className="feedback-state">
              <div className="empty-illustration">
                <FileText size={42} strokeWidth={1.2} />
                <span>?</span>
              </div>
              <h2>Good questions start here</h2>
              <p>
                Create your first form and turn curiosity into a conversation.
              </p>
              <Button onClick={() => setDialog({ type: "create" })}>
                <Plus size={16} />
                Create your first form
              </Button>
            </div>
          ) : displayed.length === 0 ? (
            <div className="feedback-state">
              <Search size={28} />
              <h2>No forms found</h2>
              <p>Try another name or clear your search.</p>
              <Button variant="secondary" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </div>
          ) : (
            <div className={view === "grid" ? "forms-grid" : "forms-list"}>
              {displayed.map((form, index) => (
                <article
                  key={form.id}
                  className={`form-card ${view === "list" ? "form-card-list" : ""}`}
                  aria-label={form.title}
                >
                  <Link
                    href={`/forms/${form.id}`}
                    className={`form-cover cover-${index % 3}`}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <div className="cover-question">
                      <span>{index + 1} →</span>
                      <div>
                        <i />
                        <i />
                        <i />
                      </div>
                    </div>
                    <span className="cover-footer">
                      Made for a conversation
                    </span>
                  </Link>
                  <div className="form-card-content">
                    <div className="form-card-heading">
                      <Link
                        href={`/forms/${form.id}`}
                        className="form-card-title"
                      >
                        {form.title}
                      </Link>
                      <Menu
                        label={`Actions for ${form.title}`}
                        items={menuItems(form)}
                        disabled={busyId !== null}
                      />
                    </div>
                    <div className="form-card-meta">
                      <Status status={form.status} />
                      <span>
                        {form.response_count}{" "}
                        {form.response_count === 1 ? "response" : "responses"}
                      </span>
                    </div>
                    <div className="form-card-bottom">
                      <span>
                        Updated{" "}
                        {new Intl.DateTimeFormat("en", {
                          month: "short",
                          day: "numeric",
                        }).format(new Date(form.updated_at))}
                      </span>
                      <Link
                        href={`/forms/${form.id}`}
                        aria-label={`Edit ${form.title}`}
                      >
                        <ArrowUpRight size={16} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
      {dialog?.type === "create" && (
        <TitleDialog
          mode="create"
          onClose={() => setDialog(null)}
          onSubmit={async (title) => {
            const form = await formsApi.create(title);
            toast.success("Form created");
            setDialog(null);
            router.push(`/forms/${form.id}`);
          }}
        />
      )}
      {dialog?.type === "rename" && (
        <TitleDialog
          mode="rename"
          initial={dialog.form.title}
          onClose={() => setDialog(null)}
          onSubmit={async (title) => {
            replace(await formsApi.rename(dialog.form.id, title));
            setDialog(null);
            toast.success("Form renamed");
          }}
        />
      )}
      {dialog?.type === "delete" && (
        <ConfirmDialog
          title="Delete this form?"
          description={`“${dialog.form.title}” and all its responses will be permanently deleted. This can’t be undone.`}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await formsApi.remove(dialog.form.id);
            setForms(
              (previous) =>
                previous?.filter((form) => form.id !== dialog.form.id) ?? [],
            );
            setDialog(null);
            toast.success("Form deleted");
          }}
        />
      )}
      {dialog?.type === "share" && (
        <ShareDialog form={dialog.form} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
