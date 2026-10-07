import { Builder } from "@/features/builder/builder";
import { notFound } from "next/navigation";

export default async function FormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const id = Number(formId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  return <Builder key={id} formId={id} />;
}
