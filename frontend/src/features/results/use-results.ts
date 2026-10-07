"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { formsApi } from "@/lib/api/forms";
import { resultsApi } from "@/lib/api/results";
import type { Form } from "@/types/form";
import type {
  FormStatistics,
  ResponseDetail,
  ResponseSummary,
} from "@/types/results";

export type Resource<T> =
  | { state: "loading" }
  | { state: "ready"; data: T }
  | { state: "error"; error: unknown };

export function useResults(formId: number, responseId?: number) {
  const [form, setForm] = useState<Resource<Form>>({ state: "loading" });
  const [responses, setResponses] = useState<Resource<ResponseSummary[]>>({
    state: "loading",
  });
  const [statistics, setStatistics] = useState<Resource<FormStatistics>>({
    state: "loading",
  });
  const [response, setResponse] = useState<Resource<ResponseDetail>>({
    state: "loading",
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const signal = AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(10000),
    ]);
    async function load<T>(
      promise: Promise<T>,
      set: Dispatch<SetStateAction<Resource<T>>>,
    ) {
      try {
        const data = await promise;
        if (!controller.signal.aborted) set({ state: "ready", data });
      } catch (error) {
        if (!controller.signal.aborted) set({ state: "error", error });
      }
    }
    void Promise.allSettled([
      load(formsApi.get(formId, signal), setForm),
      ...(responseId === undefined
        ? [
            load(resultsApi.getResponses(formId, signal), setResponses),
            load(resultsApi.getStatistics(formId, signal), setStatistics),
          ]
        : [
            load(
              resultsApi.getResponse(formId, responseId, signal),
              setResponse,
            ),
          ]),
    ]);
    return () => controller.abort();
  }, [formId, responseId, version]);

  function refresh() {
    setForm({ state: "loading" });
    setResponses({ state: "loading" });
    setStatistics({ state: "loading" });
    setResponse({ state: "loading" });
    setVersion((previous) => previous + 1);
  }
  return { form, responses, statistics, response, refresh, setForm };
}
