"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/i18n";

/** Page numbers with gaps: 1 … 4 5 6 … 12 (0-based `page`, like the backend PageResponse). */
function pageItems(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
  const items: (number | "gap")[] = [0];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages - 2, page + 1);
  if (start > 1) items.push("gap");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < totalPages - 2) items.push("gap");
  items.push(totalPages - 1);
  return items;
}

const ITEM =
  "flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1 rounded px-2 text-sm font-semibold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40";

/** BankDash "Previous 1 2 3 Next" pager. */
export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const t = useT();
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={t.common.pagination} className="flex flex-wrap items-center justify-end gap-1">
      <button
        type="button"
        className={`${ITEM} text-fg-2 hover:bg-surface-2`}
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft aria-hidden className="size-4" />
        <span className="hidden sm:inline">{t.common.previous}</span>
      </button>
      {pageItems(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-fg-subtle">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            className={`${ITEM} ${item === page ? "bg-primary text-black" : "text-fg-2 hover:bg-surface-2"}`}
            onClick={() => onChange(item)}
          >
            {item + 1}
          </button>
        ),
      )}
      <button
        type="button"
        className={`${ITEM} text-fg-2 hover:bg-surface-2`}
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        <span className="hidden sm:inline">{t.common.next}</span>
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </nav>
  );
}
