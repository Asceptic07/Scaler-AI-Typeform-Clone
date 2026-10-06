import { getHealth } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  let backendStatus = "Unavailable";
  try {
    await getHealth();
    backendStatus = "Connected";
  } catch {
    // Backend downtime should not prevent this temporary page from loading.
  }

  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl font-semibold">Typeform Clone</h1>
      <p>Frontend: Running</p>
      <p>Backend: {backendStatus}</p>
    </main>
  );
}
