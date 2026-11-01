"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Filters kept in the URL query (shareable, survive reload). `set` merges, drops empty values and resets
 * `page` unless it is part of the change. Needs a <Suspense> boundary (useSearchParams).
 */
export function useUrlFilters<K extends string>(keys: readonly K[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = Object.fromEntries(keys.map((key) => [key, searchParams.get(key) ?? ""])) as Record<K, string>;

  const set = useCallback(
    (changes: Partial<Record<K, string | number | undefined>>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === undefined || value === "" || value === null) params.delete(key);
        else params.set(key, String(value));
      }
      if (!("page" in changes)) params.delete("page");
      const search = params.toString();
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { values, set };
}
