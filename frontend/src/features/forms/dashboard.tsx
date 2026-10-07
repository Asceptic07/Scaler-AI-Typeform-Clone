"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  Blocks,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Copy,
  FileText,
  Folder,
  LayoutGrid,
  Link2,
  List,
  LockKeyhole,
  PanelTop,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Undo2,
  UserRoundPlus,
  UsersRound,
  Workflow,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import { Menu } from "@/components/ui/menu";
import { Modal } from "@/components/ui/modal";
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
import "./dashboard.css";

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
  const [view, setView] = useState<"grid" | "list">("list");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [placeholder, setPlaceholder] = useState<string | null>(null);
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
      label: "View results",
      icon: <BarChart3 size={16} />,
      onClick: () => router.push(`/forms/${form.id}/results`),
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
            label: "Share",
            icon: <Send size={16} />,
            onClick: () => setDialog({ type: "share", form }),
          },
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
    <div className="workspace-app dashboard-workspace">
      <header className="workspace-header">
        <button
          className="dashboard-account"
          onClick={() => setPlaceholder("Account settings")}
          aria-label="Personal workspace account"
        >
          <span className="dashboard-brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>Personal workspace</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        <nav
          className="dashboard-header-actions"
          aria-label="Account navigation"
        >
          <button onClick={() => setPlaceholder("Integrations")}>
            <Blocks size={16} aria-hidden="true" />
            Integrations
          </button>
          <button onClick={() => setPlaceholder("Brand kit")}>
            <BriefcaseBusiness size={16} aria-hidden="true" />
            Brand kit
          </button>
          <button
            className="icon-button"
            aria-label="Help"
            onClick={() => setPlaceholder("Help")}
          >
            <CircleHelp size={18} />
          </button>
          <button
            className="avatar"
            aria-label="Creator account"
            onClick={() => setPlaceholder("Account settings")}
          >
            SC
          </button>
        </nav>
      </header>
      {bannerVisible && (
        <aside
          className="dashboard-info-banner"
          aria-label="Workspace information"
        >
          <span>Your workspace is ready to collect responses.</span>
          <button
            className="icon-button"
            aria-label="Dismiss workspace banner"
            onClick={() => setBannerVisible(false)}
          >
            <X size={15} />
          </button>
        </aside>
      )}
      <nav className="workspace-tabs" aria-label="Main navigation">
        <Link href="/" className="workspace-tab active" aria-current="page">
          <FileText size={17} />
          Forms
        </Link>
        {[
          { label: "Contacts", Icon: UsersRound },
          { label: "Automations", Icon: Workflow },
          { label: "Insights", Icon: BarChart3 },
          { label: "Pages", Icon: PanelTop },
        ].map(({ label, Icon }) => (
          <button
            key={label}
            className="workspace-tab"
            onClick={() => setPlaceholder(label)}
          >
            <Icon size={17} aria-hidden="true" />
            {label}
          </button>
        ))}
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
          <div className="dashboard-sidebar-heading">
            <span className="sidebar-label">WORKSPACES</span>
            <button
              className="icon-button"
              aria-label="Add workspace"
              onClick={() => setPlaceholder("Workspaces")}
            >
              <Plus size={16} />
            </button>
          </div>
          <p className="dashboard-private-label">
            <LockKeyhole size={12} aria-hidden="true" />
            Private
          </p>
          <a href="#workspace-content" className="workspace-folder">
            <Folder size={17} />
            My workspace<span>{forms?.length ?? "—"}</span>
          </a>
          <div className="dashboard-response-usage">
            <span>Responses collected</span>
            <strong>
              {forms
                ? `${forms.reduce((total, form) => total + form.response_count, 0).toLocaleString()} responses`
                : "—"}
            </strong>
          </div>
          <button
            className="dashboard-ai"
            onClick={() => setPlaceholder("Ask AI")}
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>Ask AI</span>
            <span>Coming soon</span>
          </button>
        </aside>
        <main id="workspace-content" className="workspace-content">
          <div className="workspace-title-row">
            <div className="dashboard-workspace-title">
              <h1>My workspace</h1>
              <Menu
                label="Workspace actions"
                items={[
                  {
                    label: "Workspace settings",
                    icon: <Folder size={16} />,
                    onClick: () => setPlaceholder("Workspace settings"),
                  },
                ]}
              />
              <button
                className="dashboard-invite"
                onClick={() => setPlaceholder("Invite collaborators")}
              >
                <UserRoundPlus size={16} aria-hidden="true" />
                Invite
              </button>
            </div>
            <div className="view-controls">
              <label className="sort-control">
                <CalendarDays size={15} aria-hidden="true" />
                <select
                  aria-label="Sort forms"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="created">Date created</option>
                  <option value="updated">Last updated</option>
                  <option value="title">Name A–Z</option>
                </select>
                <ChevronDown size={13} aria-hidden="true" />
              </label>
              <div className="segmented">
                <button
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List size={16} />
                  <span>List</span>
                </button>
                <button
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid size={16} />
                  <span>Grid</span>
                </button>
              </div>
            </div>
            <Button
              className="create-main"
              onClick={() => setDialog({ type: "create" })}
            >
              <Plus size={17} />
              Create form
            </Button>
          </div>
          {search && (
            <p className="dashboard-search-caption" role="status">
              Results for “{search}” · {displayed.length}{" "}
              {displayed.length === 1 ? "form" : "forms"}
            </p>
          )}
          <div className="workspace-search mobile-workspace-search">
            <Search size={17} aria-hidden="true" />
            <input
              aria-label="Search forms"
              placeholder="Search forms"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
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
          ) : view === "list" ? (
            <div className="dashboard-form-list">
              <div className="dashboard-list-heading" aria-hidden="true">
                <span>Form</span>
                <span>Responses</span>
                <span>Updated</span>
                <span>Integrations</span>
                <span />
              </div>
              <ul className="forms-list" aria-label="Forms in My workspace">
                {displayed.map((form) => (
                  <li
                    key={form.id}
                    className="dashboard-form-row form-card"
                    aria-label={form.title}
                  >
                    <div className="dashboard-form-identity">
                      <span
                        className={`dashboard-form-thumbnail cover-${form.id % 3}`}
                        aria-hidden="true"
                      >
                        <FileText size={18} strokeWidth={1.5} />
                      </span>
                      <Link
                        href={`/forms/${form.id}`}
                        className="form-card-title"
                        title={form.title}
                      >
                        {form.title}
                      </Link>
                      <Status status={form.status} />
                    </div>
                    <Link
                      href={`/forms/${form.id}/results`}
                      className="form-results-link dashboard-response-count"
                      aria-label={`View results for ${form.title}: ${form.response_count} ${form.response_count === 1 ? "response" : "responses"}`}
                    >
                      <span className="dashboard-mobile-label">Responses</span>
                      {form.response_count.toLocaleString()}
                    </Link>
                    <time
                      className="dashboard-updated"
                      dateTime={form.updated_at}
                    >
                      <span className="dashboard-mobile-label">Updated</span>
                      {new Intl.DateTimeFormat(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(form.updated_at))}
                    </time>
                    <div className="dashboard-row-integration">
                      <button
                        className="icon-button"
                        aria-label={`Integrations for ${form.title} — coming soon`}
                        title="Integrations — coming soon"
                        onClick={() => setPlaceholder("Integrations")}
                      >
                        <Blocks size={16} />
                      </button>
                    </div>
                    <Menu
                      label={`Actions for ${form.title}`}
                      items={menuItems(form)}
                      disabled={busyId !== null}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="forms-grid">
              {displayed.map((form, index) => (
                <article
                  key={form.id}
                  className="form-card"
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
                      <Link
                        href={`/forms/${form.id}/results`}
                        className="form-results-link"
                        aria-label={`View results for ${form.title}: ${form.response_count} ${form.response_count === 1 ? "response" : "responses"}`}
                      >
                        {form.response_count}{" "}
                        {form.response_count === 1 ? "response" : "responses"}
                      </Link>
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
      {placeholder && (
        <Modal title={placeholder} onClose={() => setPlaceholder(null)}>
          {placeholder !== "Help" && (
            <span className="dashboard-placeholder-badge">Coming soon</span>
          )}
          <p className="modal-description">
            {placeholder === "Help"
              ? "Create a form, add your questions, and publish it to get a shareable link. Open Results to read answers and see question summaries."
              : `${placeholder} will be available in a future update. Your forms and responses are ready to use today.`}
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setPlaceholder(null)}>
              Done
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
