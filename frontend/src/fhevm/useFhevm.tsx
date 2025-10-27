"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import { createFhevmInstance } from "./internal/fhevm";

export type FhevmGoState = "idle" | "loading" | "ready" | "error";

export function useFhevm(parameters: {
  provider: string | ethers.Eip1193Provider | undefined;
  enabled?: boolean;
  initialMockChains?: Readonly<Record<number, string>>;
}) {
  const { provider, enabled = true, initialMockChains } = parameters;
  const [instance, setInstance] = useState<any | undefined>(undefined);
  const [status, setStatus] = useState<FhevmGoState>("idle");
  const [error, setError] = useState<Error | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);
  const providerRef = useRef<typeof provider>(provider);

  const refresh = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    providerRef.current = provider;
    setInstance(undefined);
    setError(undefined);
    setStatus("idle");
    if (!provider) return;
    if (!enabled) return;

    abortRef.current = new AbortController();
    setStatus("loading");
    createFhevmInstance({
      provider: provider,
      mockChains: initialMockChains as Record<number, string> | undefined,
      signal: abortRef.current.signal,
      onStatusChange: (s) => console.log("[useFhevm]", s),
    })
      .then((i) => {
        if (abortRef.current?.signal.aborted) return;
        setInstance(i);
        setStatus("ready");
      })
      .catch((e) => {
        if (abortRef.current?.signal.aborted) return;
        setError(e);
        setStatus("error");
      });
  }, [provider, enabled, initialMockChains]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { instance, refresh, status, error } as const;
}


