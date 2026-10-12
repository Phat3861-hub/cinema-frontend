import type { ReactNode } from "react";

/** Temporary shell for unfinished pages; remove it as each feature is implemented. */
export function PagePlaceholder({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-6 text-zinc-500 dark:border-zinc-700">
        {children ?? "Đang phát triển."}
      </div>
    </section>
  );
}
