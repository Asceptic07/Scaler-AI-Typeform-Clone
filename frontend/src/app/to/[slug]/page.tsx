import type { Metadata } from "next";
import { RespondentForm } from "@/features/respondent/respondent-form";
import "@/features/respondent/respondent.css";

export const metadata: Metadata = {
  title: "Your form · Typeform Clone",
  description: "A conversation, one question at a time.",
};

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <RespondentForm key={slug} slug={slug} />;
}
