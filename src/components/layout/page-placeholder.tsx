import type { ReactNode } from "react";

/** Temporary shell for unfinished pages; remove it as each feature is implemented. */
export function PagePlaceholder({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-[1232px] px-4 py-10">
      <h1 className="text-h4">{title}</h1>
      <div className="mt-4 rounded-lg border border-dashed border-neutral-600 p-6 text-neutral-300">
        {children ?? "Đang phát triển."}
      </div>
    </section>
  );
}
