import { z } from "zod";

import { API_BASE_URL } from "@/lib/config";

const healthSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
});

export type HealthResponse = z.infer<typeof healthSchema>;

export async function getHealth(): Promise<HealthResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch (cause) {
    throw new Error("Backend health request failed", { cause });
  }

  if (!response.ok) {
    throw new Error(`Backend health request returned HTTP ${response.status}`);
  }

  return healthSchema.parse(await response.json());
}
