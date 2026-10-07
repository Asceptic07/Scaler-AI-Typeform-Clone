import type { FormStatus } from "@/types/form";
export function Status({ status }: { status: FormStatus }) {
  return (
    <span className={`status status-${status}`}>
      <span />
      {status === "published" ? "Published" : "Draft"}
    </span>
  );
}
