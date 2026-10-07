import { notFound } from "next/navigation";
import { ResponseView } from "@/features/results/results";
import "@/features/results/results.css";

export default async function ResponsePage({
  params,
}: {
  params: Promise<{ formId: string; responseId: string }>;
}) {
  const { formId, responseId } = await params;
  const id = Number(formId);
  const response = Number(responseId);
  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !Number.isSafeInteger(response) ||
    response < 1
  )
    notFound();
  return (
    <ResponseView key={`${id}-${response}`} formId={id} responseId={response} />
  );
}
