"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Result<T> {
  key: string;
  data?: T;
  error?: unknown;
}

/**
 * Loads data in the browser (cookies carry the session). Re-fetches when `key` changes; `key = null` skips.
 * `data` keeps the previous value while a new key loads, so lists don't flash; `setData` patches it after a mutation.
 */
export function useApi<T>(key: string | null, fetcher: () => Promise<T>) {
  const fetcherRef = useRef(fetcher);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const fullKey = key === null ? null : `${key}#${version}`;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (fullKey === null) return;
    let cancelled = false;
    fetcherRef.current().then(
      (data) => !cancelled && setResult({ key: fullKey, data }),
      (error: unknown) => !cancelled && setResult((prev) => ({ key: fullKey, data: prev?.data, error })),
    );
    return () => {
      cancelled = true;
    };
  }, [fullKey]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback(
    (update: (data: T | undefined) => T | undefined) =>
      setResult((prev) => (prev ? { ...prev, data: update(prev.data) } : prev)),
    [],
  );

  const settled = fullKey !== null && result?.key === fullKey;
  return {
    data: result?.data,
    error: settled ? result?.error : undefined,
    loading: fullKey !== null && !settled,
    reload,
    setData,
  };
}
