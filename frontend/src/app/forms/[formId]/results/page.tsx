import { notFound } from "next/navigation";
import { Results } from "@/features/results/results";
import "@/features/results/results.css";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const id = Number(formId);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  return <Results key={id} formId={id} />;
}
